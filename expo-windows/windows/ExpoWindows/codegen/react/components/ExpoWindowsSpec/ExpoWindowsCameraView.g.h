
/*
 * This file is auto-generated from ExpoWindowsCameraViewNativeComponent spec file in flow / TypeScript.
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

REACT_STRUCT(ExpoWindowsCameraViewProps)
struct ExpoWindowsCameraViewProps : winrt::implements<ExpoWindowsCameraViewProps, winrt::Microsoft::ReactNative::IComponentProps> {
  ExpoWindowsCameraViewProps(winrt::Microsoft::ReactNative::ViewProps props, const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom)
    : ViewProps(props)
  {
     if (cloneFrom) {
       auto cloneFromProps = cloneFrom.as<ExpoWindowsCameraViewProps>();
       facing = cloneFromProps->facing;
       mute = cloneFromProps->mute;
       zoom = cloneFromProps->zoom;
       enableTorch = cloneFromProps->enableTorch;
       flashMode = cloneFromProps->flashMode;
       active = cloneFromProps->active;
       onCameraReady = cloneFromProps->onCameraReady;
       onMountError = cloneFromProps->onMountError;
       onPictureTaken = cloneFromProps->onPictureTaken;
       onRecordingFinished = cloneFromProps->onRecordingFinished;
       onPictureSizes = cloneFromProps->onPictureSizes;  
     }
  }

  void SetProp(uint32_t hash, winrt::hstring propName, winrt::Microsoft::ReactNative::IJSValueReader value) noexcept {
    winrt::Microsoft::ReactNative::ReadProp(hash, propName, value, *this);
  }

  REACT_FIELD(facing)
  std::optional<std::string> facing;

  REACT_FIELD(mute)
  std::optional<bool> mute{};

  REACT_FIELD(zoom)
  std::optional<double> zoom{};

  REACT_FIELD(enableTorch)
  std::optional<bool> enableTorch{};

  REACT_FIELD(flashMode)
  std::optional<std::string> flashMode;

  REACT_FIELD(active)
  bool active{true};

   // These fields can be used to determine if JS has registered for this event
  REACT_FIELD(onCameraReady)
  bool onCameraReady{false};

  REACT_FIELD(onMountError)
  bool onMountError{false};

  REACT_FIELD(onPictureTaken)
  bool onPictureTaken{false};

  REACT_FIELD(onRecordingFinished)
  bool onRecordingFinished{false};

  REACT_FIELD(onPictureSizes)
  bool onPictureSizes{false};

  const winrt::Microsoft::ReactNative::ViewProps ViewProps;
};

REACT_STRUCT(ExpoWindowsCameraViewSpec_onPictureSizes)
struct ExpoWindowsCameraViewSpec_onPictureSizes {
  REACT_FIELD(requestId)
  int32_t requestId{};

  REACT_FIELD(sizes)
  std::string sizes;
};

REACT_STRUCT(ExpoWindowsCameraViewSpec_onRecordingFinished)
struct ExpoWindowsCameraViewSpec_onRecordingFinished {
  REACT_FIELD(requestId)
  int32_t requestId{};

  REACT_FIELD(uri)
  std::string uri;

  REACT_FIELD(error)
  std::string error;
};

REACT_STRUCT(ExpoWindowsCameraViewSpec_onPictureTaken)
struct ExpoWindowsCameraViewSpec_onPictureTaken {
  REACT_FIELD(requestId)
  int32_t requestId{};

  REACT_FIELD(uri)
  std::string uri;

  REACT_FIELD(width)
  int32_t width{};

  REACT_FIELD(height)
  int32_t height{};

  REACT_FIELD(error)
  std::string error;
};

REACT_STRUCT(ExpoWindowsCameraViewSpec_onMountError)
struct ExpoWindowsCameraViewSpec_onMountError {
  REACT_FIELD(message)
  std::string message;
};

REACT_STRUCT(ExpoWindowsCameraViewSpec_onCameraReady)
struct ExpoWindowsCameraViewSpec_onCameraReady {
};

struct ExpoWindowsCameraViewEventEmitter {
  ExpoWindowsCameraViewEventEmitter(const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter)
      : m_eventEmitter(eventEmitter) {}

  using OnCameraReady = ExpoWindowsCameraViewSpec_onCameraReady;
  using OnMountError = ExpoWindowsCameraViewSpec_onMountError;
  using OnPictureTaken = ExpoWindowsCameraViewSpec_onPictureTaken;
  using OnRecordingFinished = ExpoWindowsCameraViewSpec_onRecordingFinished;
  using OnPictureSizes = ExpoWindowsCameraViewSpec_onPictureSizes;

  void onCameraReady(OnCameraReady &&value) const {
    m_eventEmitter.DispatchEvent(L"cameraReady", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onMountError(OnMountError &&value) const {
    m_eventEmitter.DispatchEvent(L"mountError", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onPictureTaken(OnPictureTaken &&value) const {
    m_eventEmitter.DispatchEvent(L"pictureTaken", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onRecordingFinished(OnRecordingFinished &&value) const {
    m_eventEmitter.DispatchEvent(L"recordingFinished", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onPictureSizes(OnPictureSizes &&value) const {
    m_eventEmitter.DispatchEvent(L"pictureSizes", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

 private:
  winrt::Microsoft::ReactNative::EventEmitter m_eventEmitter{nullptr};
};

template<typename TUserData>
struct BaseExpoWindowsCameraView {

  virtual void UpdateProps(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::com_ptr<ExpoWindowsCameraViewProps> &newProps,
    const winrt::com_ptr<ExpoWindowsCameraViewProps> &/*oldProps*/) noexcept {
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

  virtual void UpdateEventEmitter(const std::shared_ptr<ExpoWindowsCameraViewEventEmitter> &eventEmitter) noexcept {
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

  // You must provide an implementation of this method to handle the "takePicture" command
  virtual void HandleTakePictureCommand(int32_t requestId, double quality) noexcept = 0;

  // You must provide an implementation of this method to handle the "record" command
  virtual void HandleRecordCommand(int32_t requestId, int32_t maxDurationMs) noexcept = 0;

  // You must provide an implementation of this method to handle the "stopRecording" command
  virtual void HandleStopRecordingCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "pausePreview" command
  virtual void HandlePausePreviewCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "resumePreview" command
  virtual void HandleResumePreviewCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "getAvailablePictureSizes" command
  virtual void HandleGetAvailablePictureSizesCommand(int32_t requestId) noexcept = 0;

  void HandleCommand(const winrt::Microsoft::ReactNative::ComponentView &view, const winrt::Microsoft::ReactNative::HandleCommandArgs& args) noexcept {
    auto userData = view.UserData().as<TUserData>();
    auto commandName = args.CommandName();
    if (commandName == L"takePicture") {
      int32_t requestId;
double quality;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), requestId, quality);
      userData->HandleTakePictureCommand(requestId, quality);
      return;
    }

    if (commandName == L"record") {
      int32_t requestId;
int32_t maxDurationMs;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), requestId, maxDurationMs);
      userData->HandleRecordCommand(requestId, maxDurationMs);
      return;
    }

    if (commandName == L"stopRecording") {

      userData->HandleStopRecordingCommand();
      return;
    }

    if (commandName == L"pausePreview") {

      userData->HandlePausePreviewCommand();
      return;
    }

    if (commandName == L"resumePreview") {

      userData->HandleResumePreviewCommand();
      return;
    }

    if (commandName == L"getAvailablePictureSizes") {
      int32_t requestId;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), requestId);
      userData->HandleGetAvailablePictureSizesCommand(requestId);
      return;
    }
  }

  const std::shared_ptr<ExpoWindowsCameraViewEventEmitter>& EventEmitter() const { return m_eventEmitter; }
  const winrt::com_ptr<ExpoWindowsCameraViewProps>& Props() const { return m_props; }

private:
  winrt::com_ptr<ExpoWindowsCameraViewProps> m_props;
  std::shared_ptr<ExpoWindowsCameraViewEventEmitter> m_eventEmitter;
};

template <typename TUserData>
void RegisterExpoWindowsCameraViewNativeComponent(
    winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder,
    std::function<void(const winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder&)> builderCallback) noexcept {
  packageBuilder.as<winrt::Microsoft::ReactNative::IReactPackageBuilderFabric>().AddViewComponent(
      L"ExpoWindowsCameraView", [builderCallback](winrt::Microsoft::ReactNative::IReactViewComponentBuilder const &builder) noexcept {
        auto compBuilder = builder.as<winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder>();

        builder.SetCreateProps([](winrt::Microsoft::ReactNative::ViewProps props,
                              const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom) noexcept {
            return winrt::make<ExpoWindowsCameraViewProps>(props, cloneFrom); 
        });

        builder.SetUpdatePropsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentProps &newProps,
                                     const winrt::Microsoft::ReactNative::IComponentProps &oldProps) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateProps(view, newProps ? newProps.as<ExpoWindowsCameraViewProps>() : nullptr, oldProps ? oldProps.as<ExpoWindowsCameraViewProps>() : nullptr);
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
          userData->UpdateEventEmitter(std::make_shared<ExpoWindowsCameraViewEventEmitter>(eventEmitter));
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::FinalizeUpdate != &BaseExpoWindowsCameraView<TUserData>::FinalizeUpdate) {
            builder.SetFinalizeUpdateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     winrt::Microsoft::ReactNative::ComponentViewUpdateMask mask) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->FinalizeUpdate(view, mask);
          });
        } 

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UpdateState != &BaseExpoWindowsCameraView<TUserData>::UpdateState) {
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

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::MountChildComponentView != &BaseExpoWindowsCameraView<TUserData>::MountChildComponentView) {
          builder.SetMountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->MountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UnmountChildComponentView != &BaseExpoWindowsCameraView<TUserData>::UnmountChildComponentView) {
          builder.SetUnmountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->UnmountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateAutomationPeer != &BaseExpoWindowsCameraView<TUserData>::CreateAutomationPeer) {
            builder.SetCreateAutomationPeerHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateAutomationPeer(view, args);
          });
        } 

        compBuilder.SetViewComponentViewInitializer([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
          auto userData = winrt::make_self<TUserData>();
          if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::Initialize != &BaseExpoWindowsCameraView<TUserData>::Initialize) {
            userData->Initialize(view);
          }
          view.UserData(*userData);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateVisual != &BaseExpoWindowsCameraView<TUserData>::CreateVisual) {
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
