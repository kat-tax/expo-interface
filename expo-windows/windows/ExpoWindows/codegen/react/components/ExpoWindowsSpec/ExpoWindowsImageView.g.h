
/*
 * This file is auto-generated from ExpoWindowsImageViewNativeComponent spec file in flow / TypeScript.
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

namespace winrt::ExpoWindows::Codegen {

REACT_STRUCT(ExpoWindowsImageViewProps)
struct ExpoWindowsImageViewProps : winrt::implements<ExpoWindowsImageViewProps, winrt::Microsoft::ReactNative::IComponentProps> {
  ExpoWindowsImageViewProps(winrt::Microsoft::ReactNative::ViewProps props, const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom)
    : ViewProps(props)
  {
     if (cloneFrom) {
       auto cloneFromProps = cloneFrom.as<ExpoWindowsImageViewProps>();
       source = cloneFromProps->source;
       placeholder = cloneFromProps->placeholder;
       contentFit = cloneFromProps->contentFit;
       placeholderContentFit = cloneFromProps->placeholderContentFit;
       contentPosition = cloneFromProps->contentPosition;
       transition = cloneFromProps->transition;
       cachePolicy = cloneFromProps->cachePolicy;
       tintColor = cloneFromProps->tintColor;
       blurRadius = cloneFromProps->blurRadius;
       autoplay = cloneFromProps->autoplay;
       onLoadStart = cloneFromProps->onLoadStart;
       onLoad = cloneFromProps->onLoad;
       onError = cloneFromProps->onError;
       onProgress = cloneFromProps->onProgress;
       onDisplay = cloneFromProps->onDisplay;  
     }
  }

  void SetProp(uint32_t hash, winrt::hstring propName, winrt::Microsoft::ReactNative::IJSValueReader value) noexcept {
    winrt::Microsoft::ReactNative::ReadProp(hash, propName, value, *this);
  }

  REACT_FIELD(source)
  std::optional<std::string> source;

  REACT_FIELD(placeholder)
  std::optional<std::string> placeholder;

  REACT_FIELD(contentFit)
  std::optional<std::string> contentFit;

  REACT_FIELD(placeholderContentFit)
  std::optional<std::string> placeholderContentFit;

  REACT_FIELD(contentPosition)
  std::optional<std::string> contentPosition;

  REACT_FIELD(transition)
  std::optional<std::string> transition;

  REACT_FIELD(cachePolicy)
  std::optional<std::string> cachePolicy;

  REACT_FIELD(tintColor)
  std::optional<std::string> tintColor;

  REACT_FIELD(blurRadius)
  std::optional<double> blurRadius{};

  REACT_FIELD(autoplay)
  bool autoplay{true};

   // These fields can be used to determine if JS has registered for this event
  REACT_FIELD(onLoadStart)
  bool onLoadStart{false};

  REACT_FIELD(onLoad)
  bool onLoad{false};

  REACT_FIELD(onError)
  bool onError{false};

  REACT_FIELD(onProgress)
  bool onProgress{false};

  REACT_FIELD(onDisplay)
  bool onDisplay{false};

  const winrt::Microsoft::ReactNative::ViewProps ViewProps;
};

REACT_STRUCT(ExpoWindowsImageViewSpec_onDisplay)
struct ExpoWindowsImageViewSpec_onDisplay {
};

REACT_STRUCT(ExpoWindowsImageViewSpec_onProgress)
struct ExpoWindowsImageViewSpec_onProgress {
  REACT_FIELD(loaded)
  int32_t loaded{};

  REACT_FIELD(total)
  int32_t total{};
};

REACT_STRUCT(ExpoWindowsImageViewSpec_onError)
struct ExpoWindowsImageViewSpec_onError {
  REACT_FIELD(error)
  std::string error;
};

REACT_STRUCT(ExpoWindowsImageViewSpec_onLoad)
struct ExpoWindowsImageViewSpec_onLoad {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(width)
  int32_t width{};

  REACT_FIELD(height)
  int32_t height{};

  REACT_FIELD(isAnimated)
  bool isAnimated{};

  REACT_FIELD(mediaType)
  std::string mediaType;

  REACT_FIELD(cacheType)
  std::string cacheType;
};

REACT_STRUCT(ExpoWindowsImageViewSpec_onLoadStart)
struct ExpoWindowsImageViewSpec_onLoadStart {
};

struct ExpoWindowsImageViewEventEmitter {
  ExpoWindowsImageViewEventEmitter(const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter)
      : m_eventEmitter(eventEmitter) {}

  using OnLoadStart = ExpoWindowsImageViewSpec_onLoadStart;
  using OnLoad = ExpoWindowsImageViewSpec_onLoad;
  using OnError = ExpoWindowsImageViewSpec_onError;
  using OnProgress = ExpoWindowsImageViewSpec_onProgress;
  using OnDisplay = ExpoWindowsImageViewSpec_onDisplay;

  void onLoadStart(OnLoadStart &&value) const {
    m_eventEmitter.DispatchEvent(L"loadStart", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onLoad(OnLoad &&value) const {
    m_eventEmitter.DispatchEvent(L"load", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onError(OnError &&value) const {
    m_eventEmitter.DispatchEvent(L"error", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onProgress(OnProgress &&value) const {
    m_eventEmitter.DispatchEvent(L"progress", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onDisplay(OnDisplay &&value) const {
    m_eventEmitter.DispatchEvent(L"display", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

 private:
  winrt::Microsoft::ReactNative::EventEmitter m_eventEmitter{nullptr};
};

template<typename TUserData>
struct BaseExpoWindowsImageView {

  virtual void UpdateProps(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::com_ptr<ExpoWindowsImageViewProps> &newProps,
    const winrt::com_ptr<ExpoWindowsImageViewProps> &/*oldProps*/) noexcept {
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

  virtual void UpdateEventEmitter(const std::shared_ptr<ExpoWindowsImageViewEventEmitter> &eventEmitter) noexcept {
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

  // You must provide an implementation of this method to handle the "startAnimating" command
  virtual void HandleStartAnimatingCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "stopAnimating" command
  virtual void HandleStopAnimatingCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "reload" command
  virtual void HandleReloadCommand() noexcept = 0;

  void HandleCommand(const winrt::Microsoft::ReactNative::ComponentView &view, const winrt::Microsoft::ReactNative::HandleCommandArgs& args) noexcept {
    auto userData = view.UserData().as<TUserData>();
    auto commandName = args.CommandName();
    if (commandName == L"startAnimating") {

      userData->HandleStartAnimatingCommand();
      return;
    }

    if (commandName == L"stopAnimating") {

      userData->HandleStopAnimatingCommand();
      return;
    }

    if (commandName == L"reload") {

      userData->HandleReloadCommand();
      return;
    }
  }

  const std::shared_ptr<ExpoWindowsImageViewEventEmitter>& EventEmitter() const { return m_eventEmitter; }
  const winrt::com_ptr<ExpoWindowsImageViewProps>& Props() const { return m_props; }

private:
  winrt::com_ptr<ExpoWindowsImageViewProps> m_props;
  std::shared_ptr<ExpoWindowsImageViewEventEmitter> m_eventEmitter;
};

template <typename TUserData>
void RegisterExpoWindowsImageViewNativeComponent(
    winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder,
    std::function<void(const winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder&)> builderCallback) noexcept {
  packageBuilder.as<winrt::Microsoft::ReactNative::IReactPackageBuilderFabric>().AddViewComponent(
      L"ExpoWindowsImageView", [builderCallback](winrt::Microsoft::ReactNative::IReactViewComponentBuilder const &builder) noexcept {
        auto compBuilder = builder.as<winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder>();

        builder.SetCreateProps([](winrt::Microsoft::ReactNative::ViewProps props,
                              const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom) noexcept {
            return winrt::make<ExpoWindowsImageViewProps>(props, cloneFrom); 
        });

        builder.SetUpdatePropsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentProps &newProps,
                                     const winrt::Microsoft::ReactNative::IComponentProps &oldProps) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateProps(view, newProps ? newProps.as<ExpoWindowsImageViewProps>() : nullptr, oldProps ? oldProps.as<ExpoWindowsImageViewProps>() : nullptr);
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
          userData->UpdateEventEmitter(std::make_shared<ExpoWindowsImageViewEventEmitter>(eventEmitter));
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::FinalizeUpdate != &BaseExpoWindowsImageView<TUserData>::FinalizeUpdate) {
            builder.SetFinalizeUpdateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     winrt::Microsoft::ReactNative::ComponentViewUpdateMask mask) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->FinalizeUpdate(view, mask);
          });
        } 

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UpdateState != &BaseExpoWindowsImageView<TUserData>::UpdateState) {
          builder.SetUpdateStateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentState &newState) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateState(view, newState);
          });
        }

        builder.SetCustomCommandHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                          const winrt::Microsoft::ReactNative::HandleCommandArgs& args) noexcept {
          auto userData = view.UserData().as<TUserData>();
          userData->HandleCommand(view, args);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::MountChildComponentView != &BaseExpoWindowsImageView<TUserData>::MountChildComponentView) {
          builder.SetMountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->MountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UnmountChildComponentView != &BaseExpoWindowsImageView<TUserData>::UnmountChildComponentView) {
          builder.SetUnmountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->UnmountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateAutomationPeer != &BaseExpoWindowsImageView<TUserData>::CreateAutomationPeer) {
            builder.SetCreateAutomationPeerHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateAutomationPeer(view, args);
          });
        } 

        compBuilder.SetViewComponentViewInitializer([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
          auto userData = winrt::make_self<TUserData>();
          if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::Initialize != &BaseExpoWindowsImageView<TUserData>::Initialize) {
            userData->Initialize(view);
          }
          view.UserData(*userData);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateVisual != &BaseExpoWindowsImageView<TUserData>::CreateVisual) {
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

} // namespace winrt::ExpoWindows::Codegen

#endif // #ifdef RNW_NEW_ARCH
