#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Devices::Enumeration;
using namespace winrt::Windows::Security::Authorization::AppCapabilityAccess;

namespace {

char const *Name(AppCapabilityAccessStatus status) noexcept {
  switch (status) {
    case AppCapabilityAccessStatus::Allowed: return "Allowed";
    case AppCapabilityAccessStatus::UserPromptRequired: return "UserPromptRequired";
    case AppCapabilityAccessStatus::DeniedByUser: return "DeniedByUser";
    case AppCapabilityAccessStatus::DeniedBySystem: return "DeniedBySystem";
    default: return "NotDeclaredByApp";
  }
}

} // namespace

/**
 * `ExpoWindowsCamera`: what `expo-camera` asks beside its view — whether
 * the machine has a camera, and the app's access to the camera and the
 * microphone as the system's privacy settings say (checked, or asked
 * for, by capability name: `webcam`, `microphone`).
 */
REACT_MODULE(ExpoWindowsCamera)
struct ExpoWindowsCamera {
  REACT_METHOD(Count, L"count")
  void Count(ReactPromise<int> promise) noexcept {
    try {
      DeviceInformation::FindAllAsync(DeviceClass::VideoCapture).Completed([promise](auto const &operation, auto) {
        try {
          promise.Resolve(static_cast<int>(operation.GetResults().Size()));
        } catch (winrt::hresult_error const &error) {
          promise.Reject(ExpoWindows::Message(error).c_str());
        }
      });
    } catch (winrt::hresult_error const &error) {
      promise.Reject(ExpoWindows::Message(error).c_str());
    }
  }

  REACT_METHOD(Access, L"access")
  void Access(std::string capability, ReactPromise<std::string> promise) noexcept {
    try {
      promise.Resolve(Name(AppCapability::Create(winrt::to_hstring(capability)).CheckAccess()));
    } catch (winrt::hresult_error const &) {
      promise.Resolve("DeniedBySystem");
    }
  }

  REACT_METHOD(RequestAccess, L"requestAccess")
  void RequestAccess(std::string capability, ReactPromise<std::string> promise) noexcept {
    try {
      auto capabilityObject = AppCapability::Create(winrt::to_hstring(capability));
      capabilityObject.RequestAccessAsync().Completed([promise, capabilityObject](auto const &operation, auto) {
        try {
          promise.Resolve(Name(operation.GetResults()));
        } catch (winrt::hresult_error const &) {
          try {
            promise.Resolve(Name(capabilityObject.CheckAccess()));
          } catch (winrt::hresult_error const &) {
            promise.Resolve("DeniedBySystem");
          }
        }
      });
    } catch (winrt::hresult_error const &) {
      promise.Resolve("DeniedBySystem");
    }
  }
};

#ifdef RNW_NEW_ARCH

#include "Islands.h"
#include "codegen/react/components/ExpoWindowsSpec/ExpoWindowsCameraView.g.h"

namespace winrt::ExpoWindows {

using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Media::Capture;
using namespace winrt::Windows::Media::Capture::Frames;
using namespace winrt::Windows::Media::Core;
using namespace winrt::Windows::Media::MediaProperties;
using namespace winrt::Windows::Media::Playback;
using namespace winrt::Windows::Storage;

/**
 * `ExpoWindowsCameraView`: a camera preview in an island — the camera's
 * frames, through `MediaCapture` and a `MediaPlayerElement` — the view
 * behind `expo-camera`'s `CameraView` on Windows. It opens the camera on
 * the panel asked (front, back, or the first there is), tells the app
 * when it is ready or why not, takes pictures into the cache as JPEG and
 * records MP4 files there, each answered by an event with the request's
 * id, and pauses and resumes the preview. The torch and the zoom follow
 * the camera's controls where it has them.
 */
struct CameraView : winrt::implements<CameraView, winrt::IInspectable>,
                    Codegen::BaseExpoWindowsCameraView<CameraView>,
                    XamlIsland<CameraView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_element = controls::MediaPlayerElement{};
    m_element.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_element.VerticalAlignment(xaml::VerticalAlignment::Stretch);
    m_element.AreTransportControlsEnabled(false);
    m_element.Stretch(xaml::Media::Stretch::UniformToFill);
    Attach(islandView, m_element);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoWindowsCameraViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoWindowsCameraViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoWindowsCameraView<CameraView>::UpdateProps(view, newProps, oldProps);
    if (!newProps) return;
    auto facing = newProps->facing.value_or("back");
    const bool mute = newProps->mute.value_or(false);
    const bool active = newProps->active;
    if (!m_capture || facing != m_facing || mute != m_mute || active != m_active) {
      m_facing = facing;
      m_mute = mute;
      m_active = active;
      if (active) {
        Open();
      } else {
        Close();
      }
    }
    m_zoom = newProps->zoom.value_or(0.0);
    m_torch = newProps->enableTorch.value_or(false) || newProps->flashMode.value_or("off") == "on";
    ApplyControls();
  }

  void HandleTakePictureCommand(int32_t requestId, double) noexcept override {
    TakePicture(requestId);
  }

  void HandleRecordCommand(int32_t requestId, int32_t maxDurationMs) noexcept override {
    Record(requestId, maxDurationMs);
  }

  void HandleStopRecordingCommand() noexcept override {
    StopRecording();
  }

  void HandlePausePreviewCommand() noexcept override {
    try {
      if (m_player) m_player.Pause();
    } catch (winrt::hresult_error const &) {
    }
  }

  void HandleResumePreviewCommand() noexcept override {
    try {
      if (m_player) m_player.Play();
    } catch (winrt::hresult_error const &) {
    }
  }

  void HandleGetAvailablePictureSizesCommand(int32_t requestId) noexcept override {
    std::string sizes = "[";
    try {
      if (m_capture) {
        bool first = true;
        for (auto const &properties : m_capture.VideoDeviceController().GetAvailableMediaStreamProperties(MediaStreamType::Photo)) {
          if (auto image = properties.try_as<ImageEncodingProperties>()) {
            sizes += (first ? "\"" : ",\"") + std::to_string(image.Width()) + "x" + std::to_string(image.Height()) + "\"";
            first = false;
          }
        }
      }
    } catch (winrt::hresult_error const &) {
    }
    sizes += "]";
    if (auto emitter = EventEmitter()) emitter->onPictureSizes(Codegen::ExpoWindowsCameraViewSpec_onPictureSizes{requestId, sizes});
  }

 private:
  /** The camera on the panel asked, where the machine says which is which; else the first. */
  static IAsyncOperation<winrt::hstring> DeviceIdAsync(std::string facing) {
    auto devices = co_await DeviceInformation::FindAllAsync(DeviceClass::VideoCapture);
    if (devices.Size() == 0) co_return winrt::hstring{};
    auto wanted = facing == "front" ? Panel::Front : Panel::Back;
    for (auto const &device : devices) {
      if (auto location = device.EnclosureLocation()) {
        if (location.Panel() == wanted) co_return device.Id();
      }
    }
    co_return devices.GetAt(0).Id();
  }

  winrt::fire_and_forget Open() noexcept {
    auto weak = get_weak();
    auto facing = m_facing;
    const bool mute = m_mute;
    Close();
    try {
      auto id = co_await DeviceIdAsync(facing);
      if (id.empty()) throw winrt::hresult_error(E_FAIL, L"This machine has no camera");
      MediaCaptureInitializationSettings settings;
      settings.VideoDeviceId(id);
      settings.StreamingCaptureMode(mute ? StreamingCaptureMode::Video : StreamingCaptureMode::AudioAndVideo);
      settings.SharingMode(MediaCaptureSharingMode::ExclusiveControl);
      MediaCapture capture;
      co_await capture.InitializeAsync(settings);
      MediaFrameSource preview{nullptr};
      for (auto const &pair : capture.FrameSources()) {
        auto source = pair.Value();
        auto info = source.Info();
        if (info.SourceKind() != MediaFrameSourceKind::Color) continue;
        if (info.MediaStreamType() == MediaStreamType::VideoPreview) {
          preview = source;
          break;
        }
        if (!preview && info.MediaStreamType() == MediaStreamType::VideoRecord) preview = source;
      }
      if (!preview) throw winrt::hresult_error(E_FAIL, L"The camera has no preview stream");
      auto self = weak.get();
      if (!self) co_return;
      self->m_capture = capture;
      self->m_player = MediaPlayer{};
      self->m_player.RealTimePlayback(true);
      self->m_player.Source(MediaSource::CreateFromMediaFrameSource(preview));
      self->m_element.SetMediaPlayer(self->m_player);
      self->m_player.Play();
      self->ApplyControls();
      if (auto emitter = self->EventEmitter()) emitter->onCameraReady(Codegen::ExpoWindowsCameraViewSpec_onCameraReady{});
    } catch (winrt::hresult_error const &error) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onMountError(Codegen::ExpoWindowsCameraViewSpec_onMountError{::ExpoWindows::Message(error)});
      }
    }
  }

  void Close() noexcept {
    try {
      if (m_player) {
        m_player.Pause();
        m_element.SetMediaPlayer(nullptr);
        m_player.Close();
      }
      if (m_capture) m_capture.Close();
    } catch (winrt::hresult_error const &) {
    }
    m_player = nullptr;
    m_capture = nullptr;
  }

  void ApplyControls() noexcept {
    try {
      if (!m_capture) return;
      auto controller = m_capture.VideoDeviceController();
      if (auto torch = controller.TorchControl(); torch.Supported()) torch.Enabled(m_torch);
      if (auto zoom = controller.ZoomControl(); zoom.Supported()) zoom.Value(zoom.Min() + (zoom.Max() - zoom.Min()) * std::clamp(m_zoom, 0.0, 1.0));
    } catch (winrt::hresult_error const &) {
    }
  }

  winrt::fire_and_forget TakePicture(int32_t requestId) noexcept {
    auto weak = get_weak();
    try {
      auto capture = m_capture;
      if (!capture) throw winrt::hresult_error(E_FAIL, L"The camera is not ready");
      auto folder = co_await StorageFolder::GetFolderFromPathAsync(winrt::hstring(::ExpoWindows::CachePath(L"Camera").wstring()));
      auto file = co_await folder.CreateFileAsync(::ExpoWindows::NewFileName(L".jpg"), CreationCollisionOption::GenerateUniqueName);
      co_await capture.CapturePhotoToStorageFileAsync(ImageEncodingProperties::CreateJpeg(), file);
      auto stream = co_await file.OpenReadAsync();
      auto decoder = co_await winrt::Windows::Graphics::Imaging::BitmapDecoder::CreateAsync(stream);
      auto self = weak.get();
      if (!self) co_return;
      if (auto emitter = self->EventEmitter()) {
        emitter->onPictureTaken(Codegen::ExpoWindowsCameraViewSpec_onPictureTaken{requestId, ::ExpoWindows::FileUri(std::filesystem::path(file.Path().c_str())), static_cast<int32_t>(decoder.PixelWidth()), static_cast<int32_t>(decoder.PixelHeight()), ""});
      }
    } catch (winrt::hresult_error const &error) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onPictureTaken(Codegen::ExpoWindowsCameraViewSpec_onPictureTaken{requestId, "", 0, 0, ::ExpoWindows::Message(error)});
      }
    }
  }

  winrt::fire_and_forget Record(int32_t requestId, int32_t maxDurationMs) noexcept {
    auto weak = get_weak();
    try {
      auto capture = m_capture;
      if (!capture) throw winrt::hresult_error(E_FAIL, L"The camera is not ready");
      if (m_recording) throw winrt::hresult_error(E_FAIL, L"A recording is under way");
      auto folder = co_await StorageFolder::GetFolderFromPathAsync(winrt::hstring(::ExpoWindows::CachePath(L"Camera").wstring()));
      auto file = co_await folder.CreateFileAsync(::ExpoWindows::NewFileName(L".mp4"), CreationCollisionOption::GenerateUniqueName);
      co_await capture.StartRecordToStorageFileAsync(MediaEncodingProfile::CreateMp4(VideoEncodingQuality::Auto), file);
      auto self = weak.get();
      if (!self) co_return;
      self->m_recording = true;
      self->m_recordingId = requestId;
      self->m_recordingFile = file;
      if (maxDurationMs > 0) {
        self->m_timer = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread().CreateTimer();
        self->m_timer.Interval(std::chrono::milliseconds(maxDurationMs));
        self->m_timer.IsRepeating(false);
        self->m_timer.Tick([weak](auto const &, auto const &) {
          if (auto strong = weak.get()) strong->StopRecording();
        });
        self->m_timer.Start();
      }
    } catch (winrt::hresult_error const &error) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onRecordingFinished(Codegen::ExpoWindowsCameraViewSpec_onRecordingFinished{requestId, "", ::ExpoWindows::Message(error)});
      }
    }
  }

  winrt::fire_and_forget StopRecording() noexcept {
    auto weak = get_weak();
    if (!m_recording) co_return;
    m_recording = false;
    if (m_timer) {
      m_timer.Stop();
      m_timer = nullptr;
    }
    const int32_t requestId = m_recordingId;
    auto file = m_recordingFile;
    auto capture = m_capture;
    try {
      if (capture) co_await capture.StopRecordAsync();
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onRecordingFinished(Codegen::ExpoWindowsCameraViewSpec_onRecordingFinished{requestId, file ? ::ExpoWindows::FileUri(std::filesystem::path(file.Path().c_str())) : "", ""});
      }
    } catch (winrt::hresult_error const &error) {
      if (auto self = weak.get()) {
        if (auto emitter = self->EventEmitter()) emitter->onRecordingFinished(Codegen::ExpoWindowsCameraViewSpec_onRecordingFinished{requestId, "", ::ExpoWindows::Message(error)});
      }
    }
  }

  controls::MediaPlayerElement m_element{nullptr};
  MediaCapture m_capture{nullptr};
  MediaPlayer m_player{nullptr};
  std::string m_facing{"back"};
  bool m_mute{false};
  bool m_active{true};
  bool m_torch{false};
  double m_zoom{0};
  bool m_recording{false};
  int32_t m_recordingId{0};
  StorageFile m_recordingFile{nullptr};
  winrt::Microsoft::UI::Dispatching::DispatcherQueueTimer m_timer{nullptr};
};

void RegisterCameraView(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<CameraView>(packageBuilder, &Codegen::RegisterExpoWindowsCameraViewNativeComponent<CameraView>);
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
