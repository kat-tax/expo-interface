import type {ComponentRef} from 'react';
import type {ViewProps} from 'react-native';
import {forwardRef, useImperativeHandle, useRef} from 'react';
import NativeCameraView, {Commands} from '../windows/specs/ExpoWindowsCameraViewNativeComponent';
import {native, unwrap} from '../native';
import {UnavailabilityError} from '../modules/base';

export type CapturedPicture = {uri: string; width: number; height: number; format: 'jpg'; base64?: string};
export type PictureOptions = {quality?: number; base64?: boolean; id?: number; onPictureSaved?: (picture: CapturedPicture) => void} & Record<string, unknown>;
export type RecordingOptions = {maxDuration?: number; maxFileSize?: number} & Record<string, unknown>;

/** What `expo-camera`'s `CameraView` calls on its native view. */
export type CameraViewRef = {
  takePicture(options: PictureOptions): Promise<CapturedPicture>;
  record(options?: RecordingOptions): Promise<{uri: string}>;
  toggleRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  pausePreview(): Promise<void>;
  resumePreview(): Promise<void>;
  getAvailablePictureSizes(): Promise<string[]>;
  getAvailableLenses(): Promise<string[]>;
};

/** The props `expo-camera`'s `CameraView` hands its native view. */
export interface CameraViewProps extends ViewProps {
  facing?: string;
  flashMode?: string;
  enableTorch?: boolean;
  mute?: boolean;
  zoom?: number;
  active?: boolean;
  onCameraReady?: () => void;
  onMountError?: (event: {nativeEvent: {message: string}}) => void;
  onPictureSaved?: (event: {nativeEvent: {data: CapturedPicture; id: number}}) => void;
  // Accepted without effect: what a webcam has no say in, and barcode scanning, which is other platforms'.
  animateShutter?: boolean;
  autoFocus?: string;
  ratio?: string;
  pictureSize?: string;
  mirror?: boolean;
  videoQuality?: string;
  videoBitrate?: number;
  poster?: string;
  responsiveOrientationWhenOrientationLocked?: boolean;
  barcodeScannerSettings?: object;
  barcodeScannerEnabled?: boolean;
  onBarcodeScanned?: (event: unknown) => void;
  onResponsiveOrientationChanged?: (event: unknown) => void;
  onAvailableLensesChanged?: (event: unknown) => void;
  selectedLens?: string;
  mode?: string;
}

type Settle = {resolve(value: never): void; reject(reason: Error): void};

/** The file's bytes in base64, through the file system library, for a picture asked for as such. */
async function base64Of(uri: string): Promise<string> {
  const files = native.fileSystem();
  if (!files) throw new UnavailabilityError('CameraView', 'takePicture');
  const handle = unwrap(files.open(uri, 'r'));
  try {
    const {size} = unwrap(files.handleInfo(handle));
    return unwrap(files.readBytes(handle, size));
  } finally {
    files.close(handle);
  }
}

/**
 * `expo-camera`'s native view on Windows: the runtime's camera island,
 * with the pictures, recordings and sizes the package asks for on the ref
 * answered by the island's events, each by the request's id. Lenses are
 * a phone's; toggling a recording is another platform's.
 */
const CameraView = forwardRef<CameraViewRef, CameraViewProps>(function CameraView(props, ref) {
  const island = useRef<ComponentRef<typeof NativeCameraView>>(null);
  const pending = useRef(new Map<number, Settle>());
  const requests = useRef(0);

  const ask = <T,>(send: (requestId: number) => void): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const requestId = ++requests.current;
      pending.current.set(requestId, {resolve: resolve as (value: never) => void, reject});
      send(requestId);
    });

  const settle = (requestId: number, error: string, value: unknown) => {
    const waiting = pending.current.get(requestId);
    pending.current.delete(requestId);
    if (!waiting) return;
    if (error) waiting.reject(new Error(error));
    else waiting.resolve(value as never);
  };

  useImperativeHandle(ref, () => ({
    async takePicture(options) {
      const picture = await ask<CapturedPicture>(requestId => {
        if (island.current) Commands.takePicture(island.current, requestId, options.quality ?? 1);
      });
      const result: CapturedPicture = options.base64 ? {...picture, base64: await base64Of(picture.uri)} : picture;
      if (options.id !== undefined) props.onPictureSaved?.({nativeEvent: {data: result, id: options.id}});
      return result;
    },
    record(options = {}) {
      return ask<{uri: string}>(requestId => {
        if (island.current) Commands.record(island.current, requestId, Math.round((options.maxDuration ?? 0) * 1000));
      });
    },
    async toggleRecording() {
      throw new UnavailabilityError('CameraView', 'toggleRecording');
    },
    async stopRecording() {
      if (island.current) Commands.stopRecording(island.current);
    },
    async pausePreview() {
      if (island.current) Commands.pausePreview(island.current);
    },
    async resumePreview() {
      if (island.current) Commands.resumePreview(island.current);
    },
    getAvailablePictureSizes() {
      return ask<string[]>(requestId => {
        if (island.current) Commands.getAvailablePictureSizes(island.current, requestId);
      });
    },
    async getAvailableLenses() {
      return [];
    },
  }));

  const {
    facing = 'back',
    flashMode = 'off',
    enableTorch = false,
    mute = false,
    zoom = 0,
    active = true,
    onCameraReady,
    onMountError,
    onPictureSaved: _saved,
    animateShutter: _shutter,
    autoFocus: _focus,
    ratio: _ratio,
    pictureSize: _size,
    mirror: _mirror,
    videoQuality: _quality,
    videoBitrate: _bitrate,
    poster: _poster,
    responsiveOrientationWhenOrientationLocked: _responsive,
    barcodeScannerSettings: _scanner,
    barcodeScannerEnabled: _scanning,
    onBarcodeScanned: _scanned,
    onResponsiveOrientationChanged: _orientation,
    onAvailableLensesChanged: _lenses,
    selectedLens: _lens,
    mode: _mode,
    ...rest
  } = props;

  return (
    <NativeCameraView
      ref={island}
      facing={facing}
      flashMode={flashMode}
      enableTorch={enableTorch}
      mute={mute}
      zoom={zoom}
      active={active}
      onCameraReady={() => onCameraReady?.()}
      onMountError={event => onMountError?.({nativeEvent: {message: event.nativeEvent.message}})}
      onPictureTaken={event => {
        const {requestId, uri, width, height, error} = event.nativeEvent;
        settle(requestId, error, {uri, width, height, format: 'jpg'});
      }}
      onRecordingFinished={event => {
        const {requestId, uri, error} = event.nativeEvent;
        settle(requestId, error, {uri});
      }}
      onPictureSizes={event => settle(event.nativeEvent.requestId, '', JSON.parse(event.nativeEvent.sizes))}
      {...rest}
    />
  );
});

export default CameraView;
