import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

// The events carry nothing; codegen wants an object type all the same.
// oxlint-disable-next-line typescript/no-empty-object-type
type EmptyEvent = Readonly<{}>;

/**
 * A WinUI 3 `MediaPlayerElement` hosted in a XAML island: the view behind
 * `expo-video`'s `VideoView` on Windows. It shows the runtime's media
 * player of the id it is given, with or without the system's transport
 * controls, and can fill the window.
 */
export interface NativeProps extends ViewProps {
  /** The id of the player the runtime's media module made; 0 shows nothing. */
  player?: CodegenTypes.Int32;
  nativeControls?: CodegenTypes.WithDefault<boolean, true>;
  /** How the video fits the view: contain, cover or fill. */
  contentFit?: string;
  onFullscreenEnter?: CodegenTypes.DirectEventHandler<EmptyEvent>;
  onFullscreenExit?: CodegenTypes.DirectEventHandler<EmptyEvent>;
  onFirstFrameRender?: CodegenTypes.DirectEventHandler<EmptyEvent>;
}

export interface NativeCommands {
  enterFullscreen: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  exitFullscreen: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['enterFullscreen', 'exitFullscreen'],
});

export default codegenNativeComponent<NativeProps>('ExpoWindowsVideoView');
