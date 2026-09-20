#pragma once

#include <winrt/Microsoft.ReactNative.h>

namespace winrt::ExpoInterface {

/** Registers the Windows search field: a WinUI `AutoSuggestBox` in an island. */
void RegisterAutoSuggest(winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
