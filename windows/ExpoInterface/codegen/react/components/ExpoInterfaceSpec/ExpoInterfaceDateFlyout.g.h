
/*
 * This file is auto-generated from ExpoInterfaceDateFlyoutNativeComponent spec file in flow / TypeScript.
 */
// clang-format off
#pragma once

#include <NativeModules.h>

#ifdef RNW_NEW_ARCH
#include <JSValueComposition.h>

#include <winrt/Microsoft.ReactNative.Composition.h>
#include <winrt/Microsoft.UI.Composition.h>
#endif // #ifdef RNW_NEW_ARCH

#ifdef RNW_NEW_ARCH

namespace winrt::ExpoInterface::Codegen {

REACT_STRUCT(ExpoInterfaceDateFlyoutProps)
struct ExpoInterfaceDateFlyoutProps : winrt::implements<ExpoInterfaceDateFlyoutProps, winrt::Microsoft::ReactNative::IComponentProps> {
  ExpoInterfaceDateFlyoutProps(winrt::Microsoft::ReactNative::ViewProps props, const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom)
    : ViewProps(props)
  {
     if (cloneFrom) {
       auto cloneFromProps = cloneFrom.as<ExpoInterfaceDateFlyoutProps>();
       open = cloneFromProps->open;
       mode = cloneFromProps->mode;
       date = cloneFromProps->date;
       time = cloneFromProps->time;
       minDate = cloneFromProps->minDate;
       maxDate = cloneFromProps->maxDate;
       x = cloneFromProps->x;
       y = cloneFromProps->y;
       accentColor = cloneFromProps->accentColor;
       theme = cloneFromProps->theme;
       onDateChange = cloneFromProps->onDateChange;
       onTimeChange = cloneFromProps->onTimeChange;
       onOpenChange = cloneFromProps->onOpenChange;  
     }
  }

  void SetProp(uint32_t hash, winrt::hstring propName, winrt::Microsoft::ReactNative::IJSValueReader value) noexcept {
    winrt::Microsoft::ReactNative::ReadProp(hash, propName, value, *this);
  }

  REACT_FIELD(open)
  bool open{};

  REACT_FIELD(mode)
  std::optional<std::string> mode;

  REACT_FIELD(date)
  std::optional<std::string> date;

  REACT_FIELD(time)
  std::optional<std::string> time;

  REACT_FIELD(minDate)
  std::optional<std::string> minDate;

  REACT_FIELD(maxDate)
  std::optional<std::string> maxDate;

  REACT_FIELD(x)
  std::optional<double> x{};

  REACT_FIELD(y)
  std::optional<double> y{};

  REACT_FIELD(accentColor)
  std::optional<std::string> accentColor;

  REACT_FIELD(theme)
  std::optional<std::string> theme;

   // These fields can be used to determine if JS has registered for this event
  REACT_FIELD(onDateChange)
  bool onDateChange{false};

  REACT_FIELD(onTimeChange)
  bool onTimeChange{false};

  REACT_FIELD(onOpenChange)
  bool onOpenChange{false};

  const winrt::Microsoft::ReactNative::ViewProps ViewProps;
};

REACT_STRUCT(ExpoInterfaceDateFlyoutSpec_onOpenChange)
struct ExpoInterfaceDateFlyoutSpec_onOpenChange {
  REACT_FIELD(open)
  bool open{};
};

REACT_STRUCT(ExpoInterfaceDateFlyoutSpec_onTimeChange)
struct ExpoInterfaceDateFlyoutSpec_onTimeChange {
  REACT_FIELD(time)
  std::string time;
};

REACT_STRUCT(ExpoInterfaceDateFlyoutSpec_onDateChange)
struct ExpoInterfaceDateFlyoutSpec_onDateChange {
  REACT_FIELD(date)
  std::string date;
};

struct ExpoInterfaceDateFlyoutEventEmitter {
  ExpoInterfaceDateFlyoutEventEmitter(const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter)
      : m_eventEmitter(eventEmitter) {}

  using OnDateChange = ExpoInterfaceDateFlyoutSpec_onDateChange;
  using OnTimeChange = ExpoInterfaceDateFlyoutSpec_onTimeChange;
  using OnOpenChange = ExpoInterfaceDateFlyoutSpec_onOpenChange;

  void onDateChange(OnDateChange &&value) const {
    m_eventEmitter.DispatchEvent(L"dateChange", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onTimeChange(OnTimeChange &&value) const {
    m_eventEmitter.DispatchEvent(L"timeChange", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onOpenChange(OnOpenChange &&value) const {
    m_eventEmitter.DispatchEvent(L"openChange", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

 private:
  winrt::Microsoft::ReactNative::EventEmitter m_eventEmitter{nullptr};
};

template<typename TUserData>
struct BaseExpoInterfaceDateFlyout {

  virtual void UpdateProps(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::com_ptr<ExpoInterfaceDateFlyoutProps> &newProps,
    const winrt::com_ptr<ExpoInterfaceDateFlyoutProps> &/*oldProps*/) noexcept {
    m_props = newProps;
  }

  // UpdateLayoutMetrics will only be called if this method is overridden
  virtual void UpdateLayoutMetrics(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::Microsoft::ReactNative::LayoutMetrics &/*newLayoutMetrics*/,
    const winrt::Microsoft::ReactNative::LayoutMetrics &/*oldLayoutMetrics*/) noexcept {
  }

  // UpdateState will only be called if this method is overridden
  virtual void UpdateState(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::Microsoft::ReactNative::IComponentState &/*newState*/) noexcept {
  }

  virtual void UpdateEventEmitter(const std::shared_ptr<ExpoInterfaceDateFlyoutEventEmitter> &eventEmitter) noexcept {
    m_eventEmitter = eventEmitter;
  }

  // MountChildComponentView will only be called if this method is overridden
  virtual void MountChildComponentView(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
           const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &/*args*/) noexcept {
  }

  // UnmountChildComponentView will only be called if this method is overridden
  virtual void UnmountChildComponentView(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
           const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &/*args*/) noexcept {
  }

  // Initialize will only be called if this method is overridden
  virtual void Initialize(const winrt::Microsoft::ReactNative::ComponentView &/*view*/) noexcept {
  }

  // CreateVisual will only be called if this method is overridden
  virtual winrt::Microsoft::UI::Composition::Visual CreateVisual(const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
    return view.as<winrt::Microsoft::ReactNative::Composition::ComponentView>().Compositor().CreateSpriteVisual();
  }

  // FinalizeUpdate will only be called if this method is overridden
  virtual void FinalizeUpdate(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
                                        winrt::Microsoft::ReactNative::ComponentViewUpdateMask /*mask*/) noexcept {
  }

  // CreateAutomationPeer will only be called if this method is overridden
  virtual winrt::Windows::Foundation::IInspectable CreateAutomationPeer(const winrt::Microsoft::ReactNative::ComponentView & /*view*/,
                                        const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& /*args*/) noexcept {
    return nullptr;
  }

  

  const std::shared_ptr<ExpoInterfaceDateFlyoutEventEmitter>& EventEmitter() const { return m_eventEmitter; }
  const winrt::com_ptr<ExpoInterfaceDateFlyoutProps>& Props() const { return m_props; }

private:
  winrt::com_ptr<ExpoInterfaceDateFlyoutProps> m_props;
  std::shared_ptr<ExpoInterfaceDateFlyoutEventEmitter> m_eventEmitter;
};

template <typename TUserData>
void RegisterExpoInterfaceDateFlyoutNativeComponent(
    winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder,
    std::function<void(const winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder&)> builderCallback) noexcept {
  packageBuilder.as<winrt::Microsoft::ReactNative::IReactPackageBuilderFabric>().AddViewComponent(
      L"ExpoInterfaceDateFlyout", [builderCallback](winrt::Microsoft::ReactNative::IReactViewComponentBuilder const &builder) noexcept {
        auto compBuilder = builder.as<winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder>();

        builder.SetCreateProps([](winrt::Microsoft::ReactNative::ViewProps props,
                              const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom) noexcept {
            return winrt::make<ExpoInterfaceDateFlyoutProps>(props, cloneFrom); 
        });

        builder.SetUpdatePropsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentProps &newProps,
                                     const winrt::Microsoft::ReactNative::IComponentProps &oldProps) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateProps(view, newProps ? newProps.as<ExpoInterfaceDateFlyoutProps>() : nullptr, oldProps ? oldProps.as<ExpoInterfaceDateFlyoutProps>() : nullptr);
        });

        compBuilder.SetUpdateLayoutMetricsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::LayoutMetrics &newLayoutMetrics,
                                      const winrt::Microsoft::ReactNative::LayoutMetrics &oldLayoutMetrics) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateLayoutMetrics(view, newLayoutMetrics, oldLayoutMetrics);
        });

        builder.SetUpdateEventEmitterHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter) noexcept {
          auto userData = view.UserData().as<TUserData>();
          userData->UpdateEventEmitter(std::make_shared<ExpoInterfaceDateFlyoutEventEmitter>(eventEmitter));
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::FinalizeUpdate != &BaseExpoInterfaceDateFlyout<TUserData>::FinalizeUpdate) {
            builder.SetFinalizeUpdateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     winrt::Microsoft::ReactNative::ComponentViewUpdateMask mask) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->FinalizeUpdate(view, mask);
          });
        } 

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UpdateState != &BaseExpoInterfaceDateFlyout<TUserData>::UpdateState) {
          builder.SetUpdateStateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentState &newState) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateState(view, newState);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::MountChildComponentView != &BaseExpoInterfaceDateFlyout<TUserData>::MountChildComponentView) {
          builder.SetMountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->MountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UnmountChildComponentView != &BaseExpoInterfaceDateFlyout<TUserData>::UnmountChildComponentView) {
          builder.SetUnmountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->UnmountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateAutomationPeer != &BaseExpoInterfaceDateFlyout<TUserData>::CreateAutomationPeer) {
            builder.SetCreateAutomationPeerHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateAutomationPeer(view, args);
          });
        } 

        compBuilder.SetViewComponentViewInitializer([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
          auto userData = winrt::make_self<TUserData>();
          if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::Initialize != &BaseExpoInterfaceDateFlyout<TUserData>::Initialize) {
            userData->Initialize(view);
          }
          view.UserData(*userData);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateVisual != &BaseExpoInterfaceDateFlyout<TUserData>::CreateVisual) {
          compBuilder.SetCreateVisualHandler([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateVisual(view);
          });
        }

        // Allow app to further customize the builder
        if (builderCallback) {
          builderCallback(compBuilder);
        }
      });
}

} // namespace winrt::ExpoInterface::Codegen

#endif // #ifdef RNW_NEW_ARCH
