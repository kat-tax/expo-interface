import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import {Linking} from 'react-native';
import {native} from '../native';
import {nativeModuleClass} from './base';
import {appScheme, readAppConfig} from './constants';

type ExpoLinkingEvents = {
  onURLReceived(url: string): void;
};

export interface ExpoLinkingModule extends InstanceType<NativeModule<ExpoLinkingEvents>> {
  getLinkingURL(): string | null;
  clearInitialURL(): void;
  startObserving(): void;
  stopObserving(): void;
}

/**
 * The URL the app was launched with: the runtime's Windows library reads
 * the activation (a protocol activation, or a URL on the command line);
 * React Native's own `Linking` is asked otherwise.
 */
function initialUrl(): Promise<string | null> {
  const linking = native.linking();
  if (!linking) return Linking.getInitialURL();
  return Promise.resolve(linking.getInitialUrl()).then(url => url || Linking.getInitialURL());
}

/**
 * `ExpoLinking`, what `expo-linking` asks for: the URL the app was opened
 * with, or received while running, and `onURLReceived` as it comes in. The
 * launch URL is asked for once and kept; a URL that reaches the running app
 * — an activation redirected to it, which the runtime's library raises as
 * React Native's `url` event — is forwarded while something listens.
 * Opening a URL is `expo-linking`'s own call into `Linking` and needs
 * nothing here.
 */
export function createLinkingModule(): ExpoLinkingModule {
  const Base = nativeModuleClass();
  class Module extends Base<ExpoLinkingEvents> implements ExpoLinkingModule {
    private url: string | null = null;
    private subscription: EmitterSubscription | null = null;

    constructor() {
      super();
      initialUrl()
        .then(url => {
          if (url) this.url = url;
        })
        .catch(() => {
          // No launch URL is an ordinary start.
        });
    }

    getLinkingURL(): string | null {
      return this.url;
    }

    clearInitialURL(): void {
      this.url = null;
    }

    startObserving(): void {
      this.subscription ??= Linking.addEventListener('url', ({url}) => {
        this.url = url;
        this.emit('onURLReceived', url);
      });
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}

/**
 * Registers the app's scheme (`expo.scheme`, the first of a list) as a URI
 * protocol for the current user, so a link with it opens the app from
 * anywhere on the machine — the runtime's library writes the registration
 * (`ActivationRegistrationManager`), no manifest needed for an unpackaged
 * app. Nothing without the library, or without a scheme.
 */
export async function registerAppProtocol(): Promise<boolean> {
  const linking = native.linking();
  const config = readAppConfig();
  const scheme = appScheme(config);
  if (!linking || !scheme) return false;
  const name = typeof config?.name === 'string' ? config.name : scheme;
  await linking.registerProtocol(scheme, name);
  return true;
}
