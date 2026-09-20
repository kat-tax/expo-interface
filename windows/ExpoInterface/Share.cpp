#include "pch.h"

#include <NativeModules.h>

#include <shobjidl_core.h>

#include <winrt/Windows.ApplicationModel.DataTransfer.h>

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::ApplicationModel::DataTransfer;

namespace winrt::ExpoInterface {

namespace {

/**
 * The app's main window.
 *
 * The share sheet belongs to a window, and a Win32 app reaches it through the
 * interop factory rather than through `GetForCurrentView`, which only exists
 * for a UWP one. The foreground window is the app's own here because the sheet
 * is only ever opened from a press inside it.
 */
HWND MainWindow() noexcept {
  const auto foreground = GetForegroundWindow();
  DWORD process = 0;
  if (foreground && GetWindowThreadProcessId(foreground, &process) && process == GetCurrentProcessId()) {
    return GetAncestor(foreground, GA_ROOT);
  }
  return nullptr;
}

std::wstring ToWide(std::string_view utf8) noexcept {
  if (utf8.empty()) return {};
  const int size = MultiByteToWideChar(CP_UTF8, 0, utf8.data(), static_cast<int>(utf8.size()), nullptr, 0);
  std::wstring wide(static_cast<size_t>(size), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, utf8.data(), static_cast<int>(utf8.size()), wide.data(), size);
  return wide;
}

/** Opens the share sheet for a message and a link, over the app's window. */
void ShareText(std::wstring title, std::wstring message, std::wstring url, ReactPromise<bool> promise) noexcept {
  try {
    const auto window = MainWindow();
    if (!window) {
      promise.Resolve(false);
      return;
    }
    auto interop = winrt::get_activation_factory<DataTransferManager, IDataTransferManagerInterop>();
    DataTransferManager manager{nullptr};
    winrt::check_hresult(interop->GetForWindow(window, winrt::guid_of<DataTransferManager>(), winrt::put_abi(manager)));
    auto token = std::make_shared<winrt::event_token>();
    *token = manager.DataRequested([title, message, url, manager, token](
                                       DataTransferManager const &,
                                       DataRequestedEventArgs const &args) {
      // One request per share: the handler leaves once it has answered.
      manager.DataRequested(*token);
      auto data = args.Request().Data();
      // A share sheet with no title shows the app's name, which says nothing
      // about what is being shared.
      data.Properties().Title(title.empty() ? winrt::hstring{L"Share"} : winrt::hstring{title});
      if (!message.empty()) data.SetText(winrt::hstring{message});
      if (!url.empty()) {
        data.SetWebLink(winrt::Windows::Foundation::Uri{winrt::hstring{url}});
        // Text as well as the link, so a target that takes only text still
        // receives the address rather than nothing.
        if (message.empty()) data.SetText(winrt::hstring{url});
      }
    });
    winrt::check_hresult(interop->ShowShareUIForWindow(window));
    promise.Resolve(true);
  } catch (winrt::hresult_error const &) {
    promise.Resolve(false);
  }
}

} // namespace

/**
 * `ExpoInterfaceShare`: the Windows share sheet, for the kit's `ShareLink`.
 *
 * React Native's own `Share` covers iOS, Android and (through
 * react-native-web's `navigator.share`) the web, but its JavaScript only
 * dispatches on `ios` and `android` — so Windows needs a module of its own.
 * This is the kit's only native module; everything else it wants from Windows
 * is a view.
 *
 * **Not yet seen working.** Pressed in an unpackaged Release build the sheet
 * did not appear and nothing was logged. Every failure here resolves `false`
 * rather than rejecting, so the app hears that no sheet opened — but that is a
 * graceful answer to a problem still unexplained, not evidence of one. Package
 * identity is the first thing to rule out: it is what stops other Windows APIs
 * in this same harness, which runs the app unpackaged.
 */
REACT_MODULE(ExpoInterfaceShare)
struct ExpoInterfaceShare {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  /** Whether there is a window to open the sheet over yet. */
  REACT_METHOD(IsAvailable, L"isAvailable")
  void IsAvailable(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([promise] { promise.Resolve(MainWindow() != nullptr); });
  }

  /** Resolves false rather than rejecting: a share nobody can make is not an error. */
  REACT_METHOD(Share, L"share")
  void Share(std::string title, std::string message, std::string url, ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([title = ToWide(title), message = ToWide(message), url = ToWide(url), promise] {
      ShareText(title, message, url, promise);
    });
  }

 private:
  ReactContext m_context;
};

} // namespace winrt::ExpoInterface
