#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "Backdrop.h"
#if __has_include("MaterialBackdrop.g.cpp")
#include "MaterialBackdrop.g.cpp"
#endif

namespace winrt::ExpoInterface::implementation {

namespace backdrops = winrt::Microsoft::UI::Composition::SystemBackdrops;

namespace {


/** A controller of the kind, or null for a kind this machine cannot draw. */
backdrops::ISystemBackdropControllerWithTargets MakeController(const winrt::hstring &kind) {
  if (kind == L"mica" || kind == L"micaAlt") {
    if (!backdrops::MicaController::IsSupported()) return nullptr;
    backdrops::MicaController mica;
    mica.Kind(kind == L"micaAlt" ? backdrops::MicaKind::BaseAlt : backdrops::MicaKind::Base);
    return mica;
  }
  if (!backdrops::DesktopAcrylicController::IsSupported()) return nullptr;
  backdrops::DesktopAcrylicController acrylic;
  acrylic.Kind(
      kind == L"acrylicThin" ? backdrops::DesktopAcrylicKind::Thin
      : kind == L"acrylicBase" ? backdrops::DesktopAcrylicKind::Base
                               : backdrops::DesktopAcrylicKind::Default);
  return acrylic;
}

} // namespace

void MaterialBackdrop::OnTargetConnected(
    const winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop &target,
    const winrt::Microsoft::UI::Xaml::XamlRoot &xamlRoot) {
  backdrops::ISystemBackdropControllerWithTargets controller{nullptr};
  try {
    controller = MakeController(m_kind);
  } catch (const winrt::hresult_error &) {
    return;
  }
  if (!controller) return;
  // XAML's default configuration follows the target's theme and the window's
  // activation, but a child island gets none, so one is made here from the
  // XAML root's theme.
  backdrops::SystemBackdropConfiguration configuration{nullptr};
  try {
    configuration = GetDefaultSystemBackdropConfiguration(target, xamlRoot);
  } catch (const winrt::hresult_error &) {
  }
  if (!configuration) {
    configuration = backdrops::SystemBackdropConfiguration{};
    configuration.IsInputActive(true);
    auto content = xamlRoot ? xamlRoot.Content().try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>() : nullptr;
    const bool dark = content && content.ActualTheme() == winrt::Microsoft::UI::Xaml::ElementTheme::Dark;
    configuration.Theme(dark ? backdrops::SystemBackdropTheme::Dark : backdrops::SystemBackdropTheme::Light);
    m_configurations.emplace_back(target, configuration);
  }
  controller.SetSystemBackdropConfiguration(configuration);
  try {
    controller.AddSystemBackdropTarget(target);
  } catch (const winrt::hresult_error &) {
    return;
  }
  m_controllers.emplace_back(target, controller);
}

void MaterialBackdrop::OnTargetDisconnected(const winrt::Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop &target) {
  for (auto it = m_controllers.begin(); it != m_controllers.end(); ++it) {
    if (it->first != target) continue;
    it->second.RemoveSystemBackdropTarget(target);
    if (auto closable = it->second.try_as<winrt::Windows::Foundation::IClosable>()) closable.Close();
    m_controllers.erase(it);
    return;
  }
}

} // namespace winrt::ExpoInterface::implementation

#endif // RNW_NEW_ARCH
