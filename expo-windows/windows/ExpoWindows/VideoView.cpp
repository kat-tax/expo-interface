#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "Common.h"
#include "Islands.h"
#include "Media.h"
#include "codegen/react/components/ExpoWindowsSpec/ExpoWindowsVideoView.g.h"

#include <NativeModules.h>

namespace winrt::ExpoWindows {

using namespace winrt::Windows::Media::Playback;

namespace {

int32_t IdOf(std::optional<int32_t> const &value) noexcept {
  return value.value_or(0);
}
int32_t IdOf(int32_t value) noexcept {
  return value;
}

bool ControlsOf(std::optional<bool> const &value) noexcept {
  return value.value_or(true);
}
bool ControlsOf(bool value) noexcept {
  return value;
}

} // namespace

/**
 * `ExpoWindowsVideoView`: a WinUI 3 `MediaPlayerElement` in an island —
 * the view behind `expo-video`'s `VideoView` on Windows. It shows the
 * media module's player of the id it is given, with the system's
 * transport controls when asked, fitted as `contentFit` says, and can
 * fill the window on command.
 */
struct VideoView : winrt::implements<VideoView, winrt::IInspectable>,
                   Codegen::BaseExpoWindowsVideoView<VideoView>,
                   XamlIsland<VideoView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_element = controls::MediaPlayerElement{};
    m_element.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_element.VerticalAlignment(xaml::VerticalAlignment::Stretch);
    m_element.AreTransportControlsEnabled(true);
    m_element.Stretch(xaml::Media::Stretch::Uniform);
    Attach(islandView, m_element);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoWindowsVideoViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoWindowsVideoViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoWindowsVideoView<VideoView>::UpdateProps(view, newProps, oldProps);
    if (!newProps) return;
    try {
      m_element.AreTransportControlsEnabled(ControlsOf(newProps->nativeControls));
      std::string fit = newProps->contentFit.value_or("contain");
      m_element.Stretch(fit == "cover" ? xaml::Media::Stretch::UniformToFill : fit == "fill" ? xaml::Media::Stretch::Fill : xaml::Media::Stretch::Uniform);
      int32_t id = IdOf(newProps->player);
      if (id != m_playerId) {
        m_playerId = id;
        m_opened.revoke();
        auto player = ::ExpoWindows::Media::PlayerFor(id);
        m_element.SetMediaPlayer(player);
        if (player) {
          m_opened = player.MediaOpened(winrt::auto_revoke, [weak = get_weak()](MediaPlayer const &, winrt::IInspectable const &) {
            if (auto self = weak.get()) {
              if (auto emitter = self->EventEmitter()) emitter->onFirstFrameRender(Codegen::ExpoWindowsVideoViewSpec_onFirstFrameRender{});
            }
          });
        }
      }
    } catch (winrt::hresult_error const &) {
    }
  }

  void HandleEnterFullscreenCommand() noexcept override {
    try {
      m_element.IsFullWindow(true);
    } catch (winrt::hresult_error const &) {
    }
    if (auto emitter = EventEmitter()) emitter->onFullscreenEnter(Codegen::ExpoWindowsVideoViewSpec_onFullscreenEnter{});
  }

  void HandleExitFullscreenCommand() noexcept override {
    try {
      m_element.IsFullWindow(false);
    } catch (winrt::hresult_error const &) {
    }
    if (auto emitter = EventEmitter()) emitter->onFullscreenExit(Codegen::ExpoWindowsVideoViewSpec_onFullscreenExit{});
  }

 private:
  controls::MediaPlayerElement m_element{nullptr};
  int32_t m_playerId{0};
  MediaPlayer::MediaOpened_revoker m_opened;
};

void RegisterVideoView(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<VideoView>(packageBuilder, &Codegen::RegisterExpoWindowsVideoViewNativeComponent<VideoView>);
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
