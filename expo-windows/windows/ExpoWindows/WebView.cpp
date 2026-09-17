#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "Common.h"
#include "Islands.h"
#include "codegen/react/components/ExpoWindowsSpec/ExpoWindowsWebView.g.h"

#include <NativeModules.h>

namespace winrt::ExpoWindows {

using namespace winrt::Microsoft::Web::WebView2::Core;
using ::ExpoWindows::ToUtf8;
using ::ExpoWindows::ToWide;

namespace {

/** Where HTML without a base URL is served from: a host of the runtime's own, never resolved. */
constexpr char const *DEFAULT_BASE_URL = "https://expo-windows.webview/";

/** A JavaScript string literal for the text: what a script embeds verbatim. */
std::string JsString(std::string_view text) {
  std::string out = "\"";
  for (unsigned char c : text) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buffer[8];
          std::snprintf(buffer, sizeof(buffer), "\\u%04x", c);
          out += buffer;
        } else {
          out += static_cast<char>(c);
        }
    }
  }
  // The line separators JSON allows and JavaScript source does not.
  std::string safe;
  for (size_t i = 0; i < out.size(); ++i) {
    if (out.compare(i, 3, "\xE2\x80\xA8") == 0) { safe += "\\u2028"; i += 2; }
    else if (out.compare(i, 3, "\xE2\x80\xA9") == 0) { safe += "\\u2029"; i += 2; }
    else safe += out[i];
  }
  return safe + "\"";
}

/**
 * The bridge every page gets before its own script runs: what
 * `react-native-webview` pages and Expo's DOM components call.
 * `postMessage` reaches `onMessage`; `injectedObjectJson` answers with the
 * JSON the `injectedJavaScriptObject` prop was given.
 */
std::string BridgeScript(std::string const &injectedObjectJson) {
  return "(function(){"
         "var json=" + JsString(injectedObjectJson.empty() ? "{}" : injectedObjectJson) + ";"
         "window.ReactNativeWebView={"
         "postMessage:function(m){window.chrome.webview.postMessage(String(m));},"
         "injectedObjectJson:function(){return json;}"
         "};"
         "})();";
}

} // namespace

/**
 * `ExpoWindowsWebView`: a WinUI 3 `WebView2` in an island — the web view
 * behind `react-native-webview` and `@expo/dom-webview` on Windows. The
 * page is a URL or HTML; the bridge and the before-content script are
 * registered to run at every document; the after-load script runs when a
 * navigation completes; `WebMessageReceived` is `onMessage`; the commands
 * run script, post a message, and drive the history. Everything waits for
 * the core to come up, which is asynchronous.
 */
struct WebViewView : winrt::implements<WebViewView, winrt::IInspectable>,
                     Codegen::BaseExpoWindowsWebView<WebViewView>,
                     XamlIsland<WebViewView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_web = controls::WebView2{};
    m_web.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_web.VerticalAlignment(xaml::VerticalAlignment::Stretch);
    Attach(islandView, m_web);
    m_web.CoreWebView2Initialized([weak = get_weak()](controls::WebView2 const &, controls::CoreWebView2InitializedEventArgs const &args) {
      if (auto self = weak.get()) self->OnCoreReady(args.Exception());
    });
    m_web.NavigationStarting([weak = get_weak()](controls::WebView2 const &, CoreWebView2NavigationStartingEventArgs const &args) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onLoadStart(self->Navigation<Codegen::ExpoWindowsWebViewSpec_onLoadStart>(ToUtf8(args.Uri()), true));
      }
    });
    m_web.NavigationCompleted([weak = get_weak()](controls::WebView2 const &, CoreWebView2NavigationCompletedEventArgs const &args) {
      if (auto self = weak.get()) self->OnNavigated(args.IsSuccess(), static_cast<int32_t>(args.WebErrorStatus()));
    });
    m_web.WebMessageReceived([weak = get_weak()](controls::WebView2 const &, CoreWebView2WebMessageReceivedEventArgs const &args) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) {
          std::string data;
          try {
            data = ToUtf8(args.TryGetWebMessageAsString());
          } catch (...) {
            data = ToUtf8(args.WebMessageAsJson());
          }
          emitter->onMessage({ToUtf8(args.Source()), self->Title(), data});
        }
      }
    });
    m_web.EnsureCoreWebView2Async();
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoWindowsWebViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoWindowsWebViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoWindowsWebView<WebViewView>::UpdateProps(view, newProps, oldProps);
    // The page's ground: the style's background colour (transparent for a DOM component, which draws its own), white by default as on the other platforms.
    try {
      auto background = newProps ? newProps->ViewProps.BackgroundColor() : nullptr;
      auto theme = view.as<composition::ComponentView>().Theme();
      m_web.DefaultBackgroundColor(background ? background.AsWindowsColor(theme) : winrt::Windows::UI::Colors::White());
    } catch (...) {
    }
    if (m_ready) Apply();
  }

  void HandleInjectJavaScriptCommand(std::string script) noexcept override {
    Run(script);
  }
  void HandlePostMessageCommand(std::string message) noexcept override {
    Run("window.dispatchEvent(new MessageEvent('message',{data:" + JsString(message) + "}));");
  }
  void HandleReloadCommand() noexcept override {
    if (m_ready) m_web.Reload();
  }
  void HandleGoBackCommand() noexcept override {
    if (m_ready && m_web.CanGoBack()) m_web.GoBack();
  }
  void HandleGoForwardCommand() noexcept override {
    if (m_ready && m_web.CanGoForward()) m_web.GoForward();
  }
  void HandleStopLoadingCommand() noexcept override {
    if (m_ready) m_web.CoreWebView2().Stop();
  }
  void HandleScrollToCommand(double x, double y, bool animated) noexcept override {
    Run("window.scrollTo({left:" + std::to_string(x) + ",top:" + std::to_string(y) + ",behavior:" + (animated ? "'smooth'" : "'auto'") + "});");
  }

 private:
  /** The core came up (or did not): settings, scripts and the first navigation follow. */
  void OnCoreReady(winrt::hresult exception) noexcept {
    if (exception != S_OK) {
      if (auto emitter = EventEmitter()) emitter->onLoadingError({"", "", static_cast<int32_t>(exception.value), "The WebView2 runtime could not be started"});
      return;
    }
    m_ready = true;
    Apply();
    for (auto const &script : m_queued) m_web.ExecuteScriptAsync(ToWide(script));
    m_queued.clear();
  }

  /** Pushes the props into the core: settings, the document scripts, and the page when it changed. */
  void Apply() noexcept {
    auto props = Props();
    if (!props) return;
    try {
      auto core = m_web.CoreWebView2();
      auto settings = core.Settings();
      const bool debugging = props->webviewDebuggingEnabled.value_or(false);
      settings.IsScriptEnabled(props->javaScriptEnabled);
      settings.AreDevToolsEnabled(debugging);
      settings.AreDefaultContextMenusEnabled(debugging);
      if (props->userAgent && !props->userAgent->empty()) settings.UserAgent(ToWide(*props->userAgent));
      std::string document = BridgeScript(props->injectedObjectJson.value_or("")) + (props->injectedJavaScriptBeforeContentLoaded ? *props->injectedJavaScriptBeforeContentLoaded : "");
      if (document != m_documentScript) {
        m_documentScript = document;
        if (!m_documentScriptId.empty()) core.RemoveScriptToExecuteOnDocumentCreated(m_documentScriptId);
        m_documentScriptId.clear();
        core.AddScriptToExecuteOnDocumentCreatedAsync(ToWide(document)).Completed([weak = get_weak(), document](auto const &operation, auto status) {
          if (status != winrt::Windows::Foundation::AsyncStatus::Completed) return;
          if (auto self = weak.get()) {
            if (self->m_documentScript == document) self->m_documentScriptId = operation.GetResults();
          }
        });
        // A page already up gets the new bridge at its next document; the one it has stays as it is.
      }
      if (props->sourceHtml) {
        // HTML is served as the document at its base URL rather than
        // handed to NavigateToString: Chromium gives an about:blank
        // document the preferred colour scheme (dark, in a dark app),
        // while a page keeps the light one unless it opts in — and
        // relative resources resolve against the base, as on Android.
        std::string base = props->sourceBaseUrl && !props->sourceBaseUrl->empty() ? *props->sourceBaseUrl : DEFAULT_BASE_URL;
        if (*props->sourceHtml != m_html || base != m_uri) {
          m_html = *props->sourceHtml;
          m_uri = base;
          ServeDocuments(core);
          core.Navigate(ToWide(m_uri));
        }
      } else if (props->sourceUri && *props->sourceUri != m_uri) {
        m_uri = *props->sourceUri;
        m_html.clear();
        core.Navigate(ToWide(m_uri));
      }
    } catch (winrt::hresult_error const &error) {
      if (auto emitter = EventEmitter()) emitter->onLoadingError({m_uri, "", static_cast<int32_t>(error.code().value), ::ExpoWindows::Message(error)});
    }
  }

  /** Answers the document request for the HTML source's base URL with the HTML, once registered. */
  void ServeDocuments(CoreWebView2 const &core) noexcept {
    if (m_serving) return;
    try {
      core.AddWebResourceRequestedFilter(L"*", CoreWebView2WebResourceContext::Document);
      m_resourceRequested = core.WebResourceRequested(winrt::auto_revoke, [weak = get_weak()](CoreWebView2 const &sender, CoreWebView2WebResourceRequestedEventArgs const &args) {
        auto self = weak.get();
        if (!self || self->m_html.empty()) return;
        try {
          if (winrt::Windows::Foundation::Uri(args.Request().Uri()).AbsoluteUri() != winrt::Windows::Foundation::Uri(ToWide(self->m_uri)).AbsoluteUri()) return;
          auto deferral = args.GetDeferral();
          auto bytes = winrt::Windows::Security::Cryptography::CryptographicBuffer::ConvertStringToBinary(ToWide(self->m_html), winrt::Windows::Security::Cryptography::BinaryStringEncoding::Utf8);
          winrt::Windows::Storage::Streams::InMemoryRandomAccessStream stream;
          auto environment = sender.Environment();
          stream.WriteAsync(bytes).Completed([stream, args, deferral, environment](auto const &, auto) {
            try {
              stream.Seek(0);
              args.Response(environment.CreateWebResourceResponse(stream, 200, L"OK", L"Content-Type: text/html; charset=utf-8"));
            } catch (...) {
            }
            deferral.Complete();
          });
        } catch (...) {
        }
      });
      m_serving = true;
    } catch (...) {
    }
  }

  void OnNavigated(bool success, int32_t status) noexcept {
    auto emitter = EventEmitter();
    if (success) {
      if (auto props = Props(); props && props->injectedJavaScript && !props->injectedJavaScript->empty()) {
        m_web.ExecuteScriptAsync(ToWide(*props->injectedJavaScript));
      }
      if (emitter) emitter->onLoad(Navigation<Codegen::ExpoWindowsWebViewSpec_onLoad>(Url(), false));
    } else if (emitter) {
      emitter->onLoadingError({Url(), Title(), status, "The navigation failed (CoreWebView2WebErrorStatus " + std::to_string(status) + ")"});
    }
    if (emitter) {
      emitter->onLoadEnd(Navigation<Codegen::ExpoWindowsWebViewSpec_onLoadEnd>(Url(), false));
      emitter->onNavigationStateChange(Navigation<Codegen::ExpoWindowsWebViewSpec_onNavigationStateChange>(Url(), false));
    }
  }

  /** Runs script in the page, once the core is up. */
  void Run(std::string const &script) noexcept {
    if (!m_ready) {
      m_queued.push_back(script);
      return;
    }
    try {
      m_web.ExecuteScriptAsync(ToWide(script));
    } catch (...) {
    }
  }

  std::string Url() const noexcept {
    try {
      return m_ready ? ToUtf8(m_web.CoreWebView2().Source()) : m_uri;
    } catch (...) {
      return m_uri;
    }
  }

  std::string Title() const noexcept {
    try {
      return m_ready ? ToUtf8(m_web.CoreWebView2().DocumentTitle()) : std::string{};
    } catch (...) {
      return {};
    }
  }

  /** A navigation event of the kind asked for: the events share their fields, not their types. */
  template <typename TEvent>
  TEvent Navigation(std::string url, bool loading) const noexcept {
    TEvent event;
    event.url = std::move(url);
    event.title = Title();
    event.loading = loading;
    try {
      event.canGoBack = m_ready && m_web.CanGoBack();
      event.canGoForward = m_ready && m_web.CanGoForward();
    } catch (...) {
      event.canGoBack = false;
      event.canGoForward = false;
    }
    return event;
  }

  controls::WebView2 m_web{nullptr};
  bool m_ready{false};
  bool m_serving{false};
  CoreWebView2::WebResourceRequested_revoker m_resourceRequested;
  std::string m_uri;
  std::string m_html;
  std::string m_documentScript;
  winrt::hstring m_documentScriptId;
  std::vector<std::string> m_queued;
};

void RegisterWebView(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<WebViewView>(packageBuilder, &Codegen::RegisterExpoWindowsWebViewNativeComponent<WebViewView>);
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
