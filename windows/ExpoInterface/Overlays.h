#pragma once

#include <winrt/Microsoft.ReactNative.h>

namespace winrt::ExpoInterface {

/**
 * What opens over the content: `ExpoInterfaceMenuFlyout`, `ExpoInterfaceContentDialog`,
 * `ExpoInterfaceFlyout`, `ExpoInterfaceInfoBar` and `ExpoInterfaceNavigationView`.
 */
void RegisterOverlays(winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
