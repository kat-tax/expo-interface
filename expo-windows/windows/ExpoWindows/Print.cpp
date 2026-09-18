#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

#include <fstream>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Microsoft::Web::WebView2::Core;
using namespace winrt::Windows::Security::Cryptography;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

/** What `expo-print` asks for: the page as HTML or by URI, its size in points, its orientation, and the PDF's bytes back. */
struct Job {
  std::string html;
  std::string uri;
  double width = 0;
  double height = 0;
  bool landscape = false;
  bool base64 = false;
};

Job JobOf(JSValueObject const &options) {
  Job job;
  auto text = [&](char const *key) { auto found = options.find(key); return found != options.end() && found->second.Type() == JSValueType::String ? found->second.AsString() : std::string{}; };
  auto number = [&](char const *key) { auto found = options.find(key); return found != options.end() && (found->second.Type() == JSValueType::Double || found->second.Type() == JSValueType::Int64) ? found->second.AsDouble() : 0.0; };
  auto flag = [&](char const *key) { auto found = options.find(key); return found != options.end() && found->second.Type() == JSValueType::Boolean && found->second.AsBoolean(); };
  job.html = text("html");
  job.uri = text("uri");
  job.width = number("width");
  job.height = number("height");
  job.landscape = text("orientation") == "landscape";
  job.base64 = flag("base64");
  return job;
}

/** A print under way: the job, its promise, and the hidden controller the page loads in. */
struct PrintJob {
  Job job;
  ReactPromise<JSValue> promise;
  bool toFile = false;
  CoreWebView2Environment environment{nullptr};
  CoreWebView2Controller controller{nullptr};
  // The core object is held here too: its events are on this wrapper, which would go, handlers and all, with the last reference.
  CoreWebView2 core{nullptr};
  CoreWebView2::NavigationCompleted_revoker navigated;
};

/** The pages of a PDF: its page objects, counted. */
int PageCount(std::string const &pdf) noexcept {
  int count = 0;
  size_t at = 0;
  while ((at = pdf.find("/Type", at)) != std::string::npos) {
    at += 5;
    while (at < pdf.size() && std::isspace(static_cast<unsigned char>(pdf[at]))) at++;
    if (pdf.compare(at, 5, "/Page") == 0 && (at + 5 >= pdf.size() || pdf[at + 5] != 's')) count++;
  }
  return count;
}

std::string ReadFile(fs::path const &path) {
  std::ifstream in(path, std::ios::binary);
  return std::string(std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>());
}

} // namespace

/**
 * `ExpoWindowsPrint`: `expo-print` over WebView2 — the page, as HTML or by
 * URI, loaded in a controller hidden behind the app's window, then
 * written as a PDF into the cache (`printToFile`, with the page count and
 * the bytes when asked) or handed to the system's print dialog
 * (`print`). Choosing a printer ahead is iOS's.
 */
REACT_MODULE(ExpoWindowsPrint)
struct ExpoWindowsPrint {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(PrintToFile, L"printToFile")
  void PrintToFile(JSValueObject options, ReactPromise<JSValue> promise) noexcept {
    Start(JobOf(options), promise, true);
  }

  REACT_METHOD(Print, L"print")
  void Print(JSValueObject options, ReactPromise<JSValue> promise) noexcept {
    Start(JobOf(options), promise, false);
  }

 private:
  void Start(Job job, ReactPromise<JSValue> const &promise, bool toFile) noexcept {
    auto print = std::make_shared<PrintJob>(PrintJob{std::move(job), promise, toFile});
    m_context.UIDispatcher().Post([this, print] { Load(print); });
  }

  /** On the UI thread: loads the page in a hidden controller; `Finish` follows when it is there. */
  fire_and_forget Load(std::shared_ptr<PrintJob> print) noexcept {
    try {
      HWND window = MainWindow();
      if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
      // One WebView2 configuration per process: WinUI's own WebView2 (under its MapControl, among others)
      // creates its environment with the default folders and the app's first language, and an environment
      // made differently fails theirs with ERROR_INVALID_STATE — so this one is made the same way.
      CoreWebView2EnvironmentOptions options;
      auto languages = winrt::Windows::Globalization::ApplicationLanguages::Languages();
      if (languages.Size() > 0) options.Language(languages.GetAt(0));
      print->environment = co_await CoreWebView2Environment::CreateWithOptionsAsync(L"", L"", options);
      print->controller = co_await print->environment.CreateCoreWebView2ControllerAsync(CoreWebView2ControllerWindowReference::CreateFromWindowHandle(reinterpret_cast<uint64_t>(window)));
      print->controller.Bounds({0, 0, 0, 0});
      print->controller.IsVisible(false);
      print->core = print->controller.CoreWebView2();
      print->navigated = print->core.NavigationCompleted(winrt::auto_revoke, [this, print](CoreWebView2 const &, CoreWebView2NavigationCompletedEventArgs const &args) {
        Finish(print, args.IsSuccess());
      });
      if (!print->job.html.empty()) {
        print->core.NavigateToString(to_hstring(print->job.html));
      } else if (!print->job.uri.empty()) {
        print->core.Navigate(to_hstring(print->job.uri));
      } else {
        throw hresult_error(E_INVALIDARG, L"Must provide either `html` or `uri` to print");
      }
    } catch (hresult_error const &error) {
      Fail(print, Message(error));
    } catch (std::exception const &error) {
      Fail(print, error.what());
    }
  }

  /** The page has loaded (or not): printed to a PDF in the cache, or handed to the system's dialog. */
  fire_and_forget Finish(std::shared_ptr<PrintJob> print, bool loaded) noexcept {
    try {
      print->navigated.revoke();
      if (!loaded) throw hresult_error(E_FAIL, L"The page could not be loaded");
      auto web = print->core;
      if (print->toFile) {
        auto settings = print->environment.CreatePrintSettings();
        settings.Orientation(print->job.landscape ? CoreWebView2PrintOrientation::Landscape : CoreWebView2PrintOrientation::Portrait);
        if (print->job.width > 0) settings.PageWidth(print->job.width / 72.0);
        if (print->job.height > 0) settings.PageHeight(print->job.height / 72.0);
        auto path = CachePath(L"Print") / NewFileName(L".pdf");
        bool written = co_await web.PrintToPdfAsync(hstring(path.wstring()), settings);
        if (!written) throw hresult_error(E_FAIL, L"The page could not be printed to a file");
        auto bytes = ReadFile(path);
        JSValueObject result{{"uri", FileUri(path)}, {"numberOfPages", PageCount(bytes)}};
        if (print->job.base64) {
          auto data = reinterpret_cast<uint8_t const *>(bytes.data());
          result["base64"] = to_string(CryptographicBuffer::EncodeToBase64String(CryptographicBuffer::CreateFromByteArray(array_view<uint8_t const>(data, data + bytes.size()))));
        }
        print->promise.Resolve(std::move(result));
        print->controller.Close();
      } else {
        // The dialog is the system's, over the app's window; the controller stays until the next print.
        if (m_printing) m_printing.Close();
        m_printing = print->controller;
        web.ShowPrintUI(CoreWebView2PrintDialogKind::System);
        print->promise.Resolve(nullptr);
      }
    } catch (hresult_error const &error) {
      Fail(print, Message(error));
    } catch (std::exception const &error) {
      Fail(print, error.what());
    }
  }

  static void Fail(std::shared_ptr<PrintJob> const &print, std::string const &message) noexcept {
    print->promise.Reject(message.c_str());
    if (print->controller) print->controller.Close();
  }

  ReactContext m_context;
  CoreWebView2Controller m_printing{nullptr};
};
