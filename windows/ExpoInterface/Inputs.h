#pragma once

#include <winrt/Microsoft.ReactNative.h>

namespace winrt::ExpoInterface {

/**
 * The value editors: `ExpoInterfaceSlider`, `ExpoInterfaceNumberBox`,
 * `ExpoInterfaceComboBox`, `ExpoInterfaceSelectorBar`, `ExpoInterfaceDatePicker`,
 * `ExpoInterfaceTimePicker`, `ExpoInterfaceTextBox` and `ExpoInterfaceColorPicker`.
 */
void RegisterInputs(winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
