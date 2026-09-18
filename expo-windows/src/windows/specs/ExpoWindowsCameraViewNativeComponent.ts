import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

// The ready event carries nothing; codegen wants an object type all the same.
// oxlint-disable-next-line typescript/no-empty-object-type
type EmptyEvent = Readonly<{}>;

type MountErrorEvent = Readonly<{message: string}>;
type PictureEvent = Readonly<{requestId: CodegenTypes.Int32; uri: string; width: CodegenTypes.Int32; height: CodegenTypes.Int32; error: string}>;
type RecordingEvent = Readonly<{requestId: CodegenTypes.Int32; uri: string; error: string}>;
type SizesEvent = Readonly<{requestId: CodegenTypes.Int32; sizes: string}>;

/**
 * A camera preview in a XAML island — `MediaCapture` shown through a
 * `MediaPlayerElement` — the view behind `expo-camera`'s `CameraView` on
 * Windows. Pictures and recordings are asked for by request id and
 * answered by events carrying it.
 */
export interface NativeProps extends ViewProps {
  /** `front` or `back`: the camera's panel, where the machine says which. */
  facing?: string;
  /** Records without sound. */
  mute?: boolean;
  /** 0 to 1 of the camera's zoom range. */
  zoom?: CodegenTypes.Double;
  enableTorch?: boolean;
  /** `on`, `off` or `auto`; a webcam has no flash, so this is the torch's word. */
  flashMode?: string;
  active?: CodegenTypes.WithDefault<boolean, true>;
  onCameraReady?: CodegenTypes.DirectEventHandler<EmptyEvent>;
  onMountError?: CodegenTypes.DirectEventHandler<MountErrorEvent>;
  onPictureTaken?: CodegenTypes.DirectEventHandler<PictureEvent>;
  onRecordingFinished?: CodegenTypes.DirectEventHandler<RecordingEvent>;
  onPictureSizes?: CodegenTypes.DirectEventHandler<SizesEvent>;
}

export interface NativeCommands {
  takePicture: (viewRef: React.ElementRef<HostComponent<NativeProps>>, requestId: CodegenTypes.Int32, quality: CodegenTypes.Double) => void;
  record: (viewRef: React.ElementRef<HostComponent<NativeProps>>, requestId: CodegenTypes.Int32, maxDurationMs: CodegenTypes.Int32) => void;
  stopRecording: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  pausePreview: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  resumePreview: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  getAvailablePictureSizes: (viewRef: React.ElementRef<HostComponent<NativeProps>>, requestId: CodegenTypes.Int32) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['takePicture', 'record', 'stopRecording', 'pausePreview', 'resumePreview', 'getAvailablePictureSizes'],
});

export default codegenNativeComponent<NativeProps>('ExpoWindowsCameraView');
