#pragma once

#include <winrt/Microsoft.ReactNative.h>

namespace winrt::ExpoInterface {

/**
 * What opens over the content, and the bar the commands sit in:
 * `ExpoInterfaceMenuFlyout`, `ExpoInterfaceContentDialog`,
 * `ExpoInterfaceTeachingTip`, `ExpoInterfaceInfoBar`, `ExpoInterfaceCommandBar`
 * and `ExpoInterfaceNavigationView`.
 */
void RegisterOverlays(winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
