#pragma once

#ifdef RNW_NEW_ARCH

#include "pch.h"

/**
 * What a runtime component hosted in a XAML island shares: the island, a
 * root the control stretches in, and the registration that ties the
 * codegen component to the island initializer. A component view is
 * `winrt::implements<T, IInspectable>`, the codegen base for its spec and
 * `XamlIsland<T>`; it creates its control and calls `Attach` from
 * `InitializeIsland`. The island takes the size the layout gives the
 * component: nothing here reports a size back to Yoga, since a web view
 * fills what it is given.
 */
namespace winrt::ExpoWindows {

namespace xaml = winrt::Microsoft::UI::Xaml;
namespace controls = winrt::Microsoft::UI::Xaml::Controls;
namespace rn = winrt::Microsoft::ReactNative;
namespace composition = winrt::Microsoft::ReactNative::Composition;

/** Makes sure WinUI is up on this thread before the first island; a host app's own application is kept. */
void EnsureXaml() noexcept;

template <typename TDerived>
struct XamlIsland {
  /** Hosts `content` in a new island connected to the component view. */
  void Attach(const composition::ContentIslandComponentView &islandView, const xaml::UIElement &content) noexcept {
    EnsureXaml();
    auto self = static_cast<TDerived *>(this);
    m_island = xaml::XamlIsland{};
    m_root = controls::Grid{};
    m_root.Children().Append(content);
    m_island.Content(m_root);
    islandView.Connect(m_island.ContentIsland());
    islandView.Destroying([weak = self->get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->CloseIsland();
    });
  }

  xaml::FrameworkElement Root() const noexcept {
    return m_root;
  }

  void CloseIsland() noexcept {
    if (m_island) {
      m_island.Close();
      m_island = nullptr;
    }
  }

 private:
  xaml::XamlIsland m_island{nullptr};
  controls::Grid m_root{nullptr};
};

/**
 * Registers a component view whose content is an island: the codegen
 * registration with the island initializer, which creates the view, hosts
 * its control and stores it as the component's user data.
 */
template <typename TView, typename TRegister>
void RegisterIsland(const rn::IReactPackageBuilder &packageBuilder, TRegister registerComponent) noexcept {
  registerComponent(packageBuilder, [](const composition::IReactCompositionViewComponentBuilder &builder) {
    builder.SetContentIslandComponentViewInitializer([](const composition::ContentIslandComponentView &islandView) noexcept {
      EnsureXaml();
      auto view = winrt::make_self<TView>();
      view->InitializeIsland(islandView);
      islandView.UserData(*view);
    });
  });
}

/** The runtime's islands: the web view. */
void RegisterWebView(const rn::IReactPackageBuilder &packageBuilder) noexcept;

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
