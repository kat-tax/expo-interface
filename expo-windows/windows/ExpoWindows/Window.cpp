#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;

namespace ExpoWindows {

/**
 * `ExpoWindowsWindow`: the app's window, for what a desktop app sets on it
 * — its title, which the kit's stack keeps at the focused screen's.
 */
REACT_MODULE(ExpoWindowsWindow)
struct ExpoWindowsWindow {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(SetTitle, L"setTitle")
  void SetTitle(std::string title) noexcept {
    m_context.UIDispatcher().Post([title = ToWide(title)] {
      if (auto window = MainWindow()) SetWindowTextW(window, title.c_str());
    });
  }

  REACT_METHOD(GetTitle, L"getTitle")
  void GetTitle(ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([promise] {
      auto window = MainWindow();
      if (!window) {
        promise.Resolve("");
        return;
      }
      std::wstring text(static_cast<size_t>(GetWindowTextLengthW(window)) + 1, L'\0');
      const int length = GetWindowTextW(window, text.data(), static_cast<int>(text.size()));
      text.resize(static_cast<size_t>(std::max(length, 0)));
      promise.Resolve(ToUtf8(text));
    });
  }

 private:
  ReactContext m_context;
};

} // namespace ExpoWindows
