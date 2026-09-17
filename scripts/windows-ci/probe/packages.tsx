/**
 * Every SDK 57 package, imported and asked what it can do — the route the
 * Windows CI app and the harness carry to prove that a bundle with all of
 * them loads on Windows, and that each answers honestly: a feature the
 * platform has works, one it lacks says so, and nothing throws at import.
 */
import {useEffect, useState} from 'react';
import {Body, Screen, Title} from 'expo-interface';
import * as Application from 'expo-application';
import * as Battery from 'expo-battery';
import {Blob} from 'expo-blob';
import * as Calendar from 'expo-calendar';
import * as Camera from 'expo-camera';
import * as Cellular from 'expo-cellular';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import {Paths} from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Localization from 'expo-localization';
import * as Location from 'expo-location';
import * as MailComposer from 'expo-mail-composer';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SecureStore from 'expo-secure-store';
import {Accelerometer} from 'expo-sensors';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import * as StoreReview from 'expo-store-review';
import * as TaskManager from 'expo-task-manager';
import * as Updates from 'expo-updates';
// Imported for the bundle, and nothing asked of them here.
import '@expo/dom-webview';
import 'expo-age-range';
import 'expo-app-metrics';
import 'expo-apple-authentication';
import 'expo-asset';
import 'expo-audio';
import 'expo-auth-session';
import 'expo-background-fetch';
import 'expo-background-task';
import 'expo-blur';
import 'expo-brightness';
import 'expo-brownfield';
import 'expo-checkbox';
import 'expo-clipboard';
import 'expo-constants';
import 'expo-device';
import 'expo-document-picker';
import 'expo-eas-client';
import 'expo-font';
import 'expo-gl';
import 'expo-image-manipulator';
import 'expo-image-picker';
import 'expo-insights';
import 'expo-intent-launcher';
import 'expo-keep-awake';
import 'expo-linear-gradient';
import 'expo-linking';
import 'expo-live-photo';
import 'expo-manifests';
import 'expo-maps';
import 'expo-media-library';
import 'expo-mesh-gradient';
import 'expo-navigation-bar';
import 'expo-observe';
import 'expo-print';
import 'expo-screen-capture';
import 'expo-sharing';
import 'expo-splash-screen';
import 'expo-sqlite';
import 'expo-status-bar';
import 'expo-system-ui';
import 'expo-tracking-transparency';
import 'expo-video';
import 'expo-video-thumbnails';
import 'expo-web-browser';
import 'expo-widgets';

type Probe = [name: string, ask: () => unknown];

const PROBES: Probe[] = [
  ['Application.applicationName', () => Application.applicationName],
  ['Application.nativeApplicationVersion', () => Application.nativeApplicationVersion],
  ['Updates.isEnabled', () => Updates.isEnabled],
  ['Crypto.randomUUID()', () => Crypto.randomUUID()],
  ["Crypto.digestStringAsync('SHA-256', 'abc')", () => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'abc')],
  ['AES round trip', async () => {
    const key = await Crypto.AESEncryptionKey.generate();
    const sealed = await Crypto.aesEncryptAsync(new TextEncoder().encode('sealed on Windows'), key, {additionalData: new TextEncoder().encode('aad')});
    const opened = (await Crypto.aesDecryptAsync(sealed, key, {additionalData: new TextEncoder().encode('aad')})) as Uint8Array;
    return `${sealed.combinedSize} bytes → ${String.fromCharCode(...opened)}`;
  }],
  ['Localization.getLocales()[0]', () => Localization.getLocales()[0]],
  ['Localization.getCalendars()[0]', () => Localization.getCalendars()[0]],
  ['Network.getNetworkStateAsync()', () => Network.getNetworkStateAsync()],
  ['Network.getIpAddressAsync()', () => Network.getIpAddressAsync()],
  ['SecureStore set then get', async () => {
    await SecureStore.setItemAsync('probe', `kept at ${new Date().toISOString()}`);
    return SecureStore.getItemAsync('probe');
  }],
  ['SecureStore.canUseBiometricAuthentication()', () => SecureStore.canUseBiometricAuthentication()],
  ['Battery.isAvailableAsync()', () => Battery.isAvailableAsync()],
  ['LocalAuthentication.hasHardwareAsync()', () => LocalAuthentication.hasHardwareAsync()],
  ['CameraView.isAvailableAsync()', () => Camera.CameraView.isAvailableAsync()],
  ['Location.hasServicesEnabledAsync()', () => Location.hasServicesEnabledAsync()],
  ['Contacts.getPermissionsAsync()', async () => (await Contacts.getPermissionsAsync()).status],
  ['Calendar.getCalendarPermissions()', async () => (await Calendar.getCalendarPermissions()).status],
  ['Notifications.getPermissionsAsync()', async () => (await Notifications.getPermissionsAsync()).status],
  ['Accelerometer.isAvailableAsync()', () => Accelerometer.isAvailableAsync()],
  ['Haptics.selectionAsync()', async () => (await Haptics.selectionAsync(), 'done')],
  ['MailComposer.isAvailableAsync()', () => MailComposer.isAvailableAsync()],
  ['ScreenOrientation.getOrientationAsync()', () => ScreenOrientation.getOrientationAsync()],
  ['StoreReview.isAvailableAsync()', () => StoreReview.isAvailableAsync()],
  ['SMS.isAvailableAsync()', () => SMS.isAvailableAsync()],
  ['Cellular.getCellularGenerationAsync()', () => Cellular.getCellularGenerationAsync()],
  ['TaskManager.isAvailableAsync()', () => TaskManager.isAvailableAsync()],
  ['Speech.getAvailableVoicesAsync()', () => Speech.getAvailableVoicesAsync()],
  ['Paths.cache.uri', () => Paths.cache.uri],
  ["new Blob(['hi']).text()", () => new Blob(['hi']).text()],
];

async function answer(ask: () => unknown): Promise<string> {
  try {
    const value = await ask();
    return `= ${JSON.stringify(value) ?? String(value)}`;
  } catch (error) {
    return `✕ ${(error as Error).message.split(',')[0]}`;
  }
}

export default function Packages() {
  const [answers, setAnswers] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    Promise.all(PROBES.map(([, ask]) => answer(ask))).then(all => {
      if (live) setAnswers(all);
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <Screen>
      <Title>Packages</Title>
      <Body>Every SDK 57 package is in this bundle. What each answers on Windows:</Body>
      {PROBES.map(([name], index) => (
        <Body key={name} testID={`probe-${index}`}>{`${name} ${answers[index] ?? '…'}`}</Body>
      ))}
    </Screen>
  );
}
