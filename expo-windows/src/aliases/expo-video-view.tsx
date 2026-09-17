import type {ComponentRef} from 'react';
import type {ViewProps} from 'react-native';
import {forwardRef, useImperativeHandle, useRef} from 'react';
import NativeVideoView, {Commands} from '../windows/specs/ExpoWindowsVideoViewNativeComponent';
import {UnavailabilityError} from '../modules/base';

/** What `expo-video`'s `VideoView` calls on its native view. */
export type VideoViewRef = {
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  startPictureInPicture(): Promise<void>;
  stopPictureInPicture(): Promise<void>;
};

/** The props `expo-video`'s `VideoView` hands its native view: the player's id, and its own. */
export interface VideoViewProps extends ViewProps {
  player?: number | null;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  onFullscreenEnter?: () => void;
  onFullscreenExit?: () => void;
  onFirstFrameRender?: () => void;
  // Accepted without effect: what Windows has no say in, or no picture in picture for.
  allowsPictureInPicture?: boolean;
  startsPictureInPictureAutomatically?: boolean;
  onPictureInPictureStart?: () => void;
  onPictureInPictureStop?: () => void;
  fullscreenOptions?: object;
  showsTimecodes?: boolean;
  requiresLinearPlayback?: boolean;
  buttonOptions?: object;
  surfaceType?: string;
  contentPosition?: object;
  playsInline?: boolean;
  allowsVideoFrameAnalysis?: boolean;
  useExoShutter?: boolean;
  crossOrigin?: string;
  useAudioNodePlayback?: boolean;
}

/**
 * `expo-video`'s native view on Windows: the runtime's `MediaPlayerElement`
 * island showing the player by its id, with fullscreen on the ref and
 * picture in picture saying it is another platform's.
 */
const VideoView = forwardRef<VideoViewRef, VideoViewProps>(function VideoView(props, ref) {
  const island = useRef<ComponentRef<typeof NativeVideoView>>(null);
  useImperativeHandle(ref, () => ({
    async enterFullscreen() {
      if (island.current) Commands.enterFullscreen(island.current);
    },
    async exitFullscreen() {
      if (island.current) Commands.exitFullscreen(island.current);
    },
    async startPictureInPicture() {
      throw new UnavailabilityError('VideoView', 'startPictureInPicture');
    },
    async stopPictureInPicture() {
      throw new UnavailabilityError('VideoView', 'stopPictureInPicture');
    },
  }));
  const {
    player,
    nativeControls = true,
    contentFit = 'contain',
    onFullscreenEnter,
    onFullscreenExit,
    onFirstFrameRender,
    allowsPictureInPicture: _pip,
    startsPictureInPictureAutomatically: _autoPip,
    onPictureInPictureStart: _pipStart,
    onPictureInPictureStop: _pipStop,
    fullscreenOptions: _fullscreenOptions,
    showsTimecodes: _timecodes,
    requiresLinearPlayback: _linear,
    buttonOptions: _buttons,
    surfaceType: _surface,
    contentPosition: _position,
    playsInline: _inline,
    allowsVideoFrameAnalysis: _analysis,
    useExoShutter: _shutter,
    crossOrigin: _crossOrigin,
    useAudioNodePlayback: _audioNode,
    ...rest
  } = props;
  return (
    <NativeVideoView
      ref={island}
      player={player ?? 0}
      nativeControls={nativeControls}
      contentFit={contentFit}
      onFullscreenEnter={() => onFullscreenEnter?.()}
      onFullscreenExit={() => onFullscreenExit?.()}
      onFirstFrameRender={() => onFirstFrameRender?.()}
      {...rest}
    />
  );
});

export default VideoView;

/** Android's texture-backed view: none here, as on iOS. */
export const NativeTextureVideoView = null;
