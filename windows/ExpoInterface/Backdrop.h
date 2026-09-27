#pragma once

#ifdef RNW_NEW_ARCH

#include "MaterialBackdrop.g.h"

#include <winrt/Microsoft.UI.Composition.SystemBackdrops.h>

namespace winrt::ExpoInterface::implementation {

/**
 * A system backdrop of one kind of material. See Backdrop.idl. XAML connects
 * it to a target (an island) and disconnects it; a controller of the kind is
 * made per target, configured to follow the target's theme, and closed with
 * it. A kind the machine cannot draw connects nothing, so whatever paints
 * over the backdrop is all that shows.
 */
struct MaterialBackdrop : MaterialBackdropT<MaterialBackdrop> {
  explicit MaterialBackdrop(const winrt::hstring &kind) : m_kind(kind) {}

  void OnTargetConnected(
      const winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop &target,
      const winrt::Microsoft::UI::Xaml::XamlRoot &xamlRoot);
  void OnTargetDisconnected(const winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop &target);
  void OnDefaultSystemBackdropConfigurationChanged(
      const winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop &,
      const winrt::Microsoft::UI::Xaml::XamlRoot &) {}

 private:
  winrt::hstring m_kind;
  std::vector<std::pair<
      winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop,
      winrt::Microsoft::UI::Composition::SystemBackdrops::ISystemBackdropControllerWithTargets>>
      m_controllers;
  std::vector<std::pair<
      winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop,
      winrt::Microsoft::UI::Composition::SystemBackdrops::SystemBackdropConfiguration>>
      m_configurations;
};

} // namespace winrt::ExpoInterface::implementation

namespace winrt::ExpoInterface::factory_implementation {
struct MaterialBackdrop : MaterialBackdropT<MaterialBackdrop, implementation::MaterialBackdrop> {};
} // namespace winrt::ExpoInterface::factory_implementation

#endif // RNW_NEW_ARCH
