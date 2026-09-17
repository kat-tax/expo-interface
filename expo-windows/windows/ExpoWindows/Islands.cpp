#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "Islands.h"

#if __has_include(<winrt/Microsoft.ReactNative.Xaml.h>)
#include <winrt/Microsoft.ReactNative.Xaml.h>
#endif

namespace winrt::ExpoWindows {

void EnsureXaml() noexcept {
  // Islands are created on the UI thread, so one process-wide flag is enough.
  static bool ready = false;
  if (ready) return;
  try {
    if (xaml::Application::Current()) {
      ready = true;
      return;
    }
  } catch (...) {
    // No application yet: WinUI reports it as an error rather than a null.
  }
#if __has_include(<winrt/Microsoft.ReactNative.Xaml.h>)
  try {
    // react-native-windows' own application: initializes XAML for the
    // thread and merges the WinUI control resources. Kept alive for the
    // life of the process, like an app's own Application object.
    static winrt::Microsoft::ReactNative::Xaml::XamlApplication application{nullptr};
    application = winrt::Microsoft::ReactNative::Xaml::XamlApplication::Current();
    if (!application) application = winrt::Microsoft::ReactNative::Xaml::XamlApplication{};
    ready = true;
    return;
  } catch (...) {
    // Fall through to plain WinUI hosting.
  }
#endif
  try {
    static xaml::Hosting::WindowsXamlManager manager{nullptr};
    manager = xaml::Hosting::WindowsXamlManager::InitializeForCurrentThread();
    if (auto application = xaml::Application::Current()) {
      application.Resources().MergedDictionaries().Append(controls::XamlControlsResources{});
    }
    ready = true;
  } catch (...) {
    // Without XAML the island initializer fails loudly, which is the honest outcome.
  }
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
