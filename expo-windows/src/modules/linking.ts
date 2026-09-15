import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import {Linking} from 'react-native';
import {nativeModuleClass} from './base';

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
 * `ExpoLinking`, what `expo-linking` asks for: the URL the app was opened
 * with, or received while running, and `onURLReceived` as it comes in. Both
 * come from React Native's own `Linking`, which react-native-windows
 * implements over protocol activation: the launch URL is asked for once and
 * kept, and the `url` event is forwarded while something listens. Opening a
 * URL is `expo-linking`'s own call into `Linking` and needs nothing here.
 */
export function createLinkingModule(): ExpoLinkingModule {
  const Base = nativeModuleClass();
  class Module extends Base<ExpoLinkingEvents> implements ExpoLinkingModule {
    private url: string | null = null;
    private subscription: EmitterSubscription | null = null;

    constructor() {
      super();
      Linking.getInitialURL()
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
