import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {NetworkState} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass} from './base';

type NetworkEvents = {
  onNetworkStateChanged(state: NetworkState): void;
};

export interface ExpoNetworkModule extends InstanceType<NativeModule<NetworkEvents>> {
  readonly getNetworkStateAsync: (() => Promise<NetworkState>) | undefined;
  readonly getIpAddressAsync: (() => Promise<string>) | undefined;
}

/**
 * `ExpoNetwork`, what `expo-network` asks: the internet connection profile
 * — its kind (Wi-Fi, ethernet, cellular, a VPN), whether it connects and
 * whether the internet is reachable over it — the IPv4 address of its
 * adapter, and `onNetworkStateChanged` from the system's status event,
 * through the runtime's library. The package takes the presence of each
 * method as availability, so they are there only with the library in the
 * app; airplane mode is Android's.
 */
export function createNetworkModule(): ExpoNetworkModule {
  const Base = nativeModuleClass();
  class Module extends Base<NetworkEvents> implements ExpoNetworkModule {
    private subscription: EmitterSubscription | null = null;

    get getNetworkStateAsync(): (() => Promise<NetworkState>) | undefined {
      const network = native.network();
      return network ? () => network.getState() : undefined;
    }

    get getIpAddressAsync(): (() => Promise<string>) | undefined {
      const network = native.network();
      return network ? () => network.getIpAddress() : undefined;
    }

    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onNetworkStateChanged', (state: NetworkState) => {
        this.emit('onNetworkStateChanged', state);
      });
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}
