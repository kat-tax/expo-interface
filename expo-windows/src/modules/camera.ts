import type {NativeModule} from 'expo-modules-core';
import type {CapabilityAccess} from '../native';
import type {PermissionResponse} from './permissions';
import {native} from '../native';
import {nativeModuleClass} from './base';
import {DENIED, GRANTED} from './permissions';
import {unavailableClass, unavailableMethod} from './unavailable';

const UNDETERMINED: PermissionResponse = {status: 'undetermined', expires: 'never', granted: false, canAskAgain: true};

/** The package's permission response for a capability's access as the privacy settings say. */
export function permissionOf(access: CapabilityAccess): PermissionResponse {
  return access === 'Allowed' ? GRANTED : access === 'UserPromptRequired' ? UNDETERMINED : DENIED;
}

type CameraEvents = {
  onModernBarcodeScanned(event: unknown): void;
};

export interface ExpoCameraModule extends InstanceType<NativeModule<CameraEvents>> {
  readonly isModernBarcodeScannerAvailable: boolean;
  readonly toggleRecordingAsyncAvailable: boolean;
  isAvailableAsync(): Promise<boolean>;
  getCameraPermissionsAsync(): Promise<PermissionResponse>;
  requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
  requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
  getAvailableVideoCodecsAsync(): Promise<string[]>;
}

/**
 * `ExpoCamera`, what `expo-camera` asks beside its view, over the
 * runtime's camera library: whether the machine has a camera, the camera
 * and microphone permissions as the system's privacy settings say (an
 * app asks the user through them, so a request that the system does not
 * grant answers as it stands), and the codec the recorder writes.
 * Barcode scanning — the scanner, `scanFromURLAsync`, the picture
 * reference — is other platforms', and throws the package's error. The
 * library gone, there is no camera.
 */
export function createCameraModule(): ExpoCameraModule {
  const Base = nativeModuleClass();
  class Module extends Base<CameraEvents> implements ExpoCameraModule {
    readonly isModernBarcodeScannerAvailable = false;
    readonly toggleRecordingAsyncAvailable = false;

    async isAvailableAsync(): Promise<boolean> {
      const library = native.camera();
      return library ? (await library.count()) > 0 : false;
    }

    async getCameraPermissionsAsync(): Promise<PermissionResponse> {
      const library = native.camera();
      return library ? permissionOf(await library.access('webcam')) : DENIED;
    }

    async requestCameraPermissionsAsync(): Promise<PermissionResponse> {
      const library = native.camera();
      return library ? permissionOf(await library.requestAccess('webcam')) : DENIED;
    }

    async getMicrophonePermissionsAsync(): Promise<PermissionResponse> {
      const library = native.camera();
      return library ? permissionOf(await library.access('microphone')) : DENIED;
    }

    async requestMicrophonePermissionsAsync(): Promise<PermissionResponse> {
      const library = native.camera();
      return library ? permissionOf(await library.requestAccess('microphone')) : DENIED;
    }

    async getAvailableVideoCodecsAsync(): Promise<string[]> {
      return native.camera() ? ['h264'] : [];
    }
  }
  const module = new Module() as ExpoCameraModule & Record<string, unknown>;
  for (const name of ['scanFromURLAsync', 'launchScanner', 'dismissScanner']) module[name] = unavailableMethod('Camera', name);
  module.Picture = unavailableClass('Camera', 'Picture');
  return module;
}
