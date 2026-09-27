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

/**
 * The slot contract for a hosting island in another file: a named content
 * area a portal fills with React Native content. Registered once the element
 * exists, unregistered when it goes; a portal waiting for the name connects
 * on registration.
 */
void RegisterSlot(const std::string &name, const winrt::Microsoft::UI::Xaml::Controls::Grid &grid) noexcept;
void UnregisterSlot(const std::string &name) noexcept;

} // namespace winrt::ExpoInterface
