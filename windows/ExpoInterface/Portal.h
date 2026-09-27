#pragma once

#include "pch.h"

namespace winrt::ExpoInterface {

/**
 * Registers `ExpoInterfacePortal`, a react-native-windows portal whose child
 * renders inside another island's content slot through a `ChildSiteLink`, and
 * `ExpoInterfaceExpander`, the first island to host one: a WinUI `Expander`
 * whose content area is such a slot. See Portal.cpp for the slot contract a
 * hosting island implements.
 */
void RegisterPortal(const winrt::Microsoft::ReactNative::IReactPackageBuilder &packageBuilder) noexcept;

} // namespace winrt::ExpoInterface
