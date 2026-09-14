#pragma once

#include <winrt/Microsoft.ReactNative.h>

namespace winrt::ExpoInterface {

/**
 * The buttons and indicators: `ExpoInterfaceButton`, `ExpoInterfaceToggleSwitch`,
 * `ExpoInterfaceCheckBox`, `ExpoInterfaceToggleButton`, `ExpoInterfaceProgress`
 * and `ExpoInterfacePersonPicture`.
 */
void RegisterControls(winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
