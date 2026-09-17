import type {EmitterSubscription} from 'react-native';
import type {NetworkState} from '../native';
import {useEffect, useState} from 'react';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';

/**
 * `@react-native-community/netinfo` on Windows: the package's functions,
 * hooks and enums over the runtime's network library (the internet
 * connection profile and its status event), the same one `expo-network`
 * reads. The package's own Windows project is from the Paper days and is
 * kept out of autolinking by `expo-windows init`; the reachability probe
 * it runs elsewhere is the profile's own answer here.
 */

export enum NetInfoStateType {
  unknown = 'unknown',
  none = 'none',
  cellular = 'cellular',
  wifi = 'wifi',
  bluetooth = 'bluetooth',
  ethernet = 'ethernet',
  wimax = 'wimax',
  vpn = 'vpn',
  other = 'other',
}

export enum NetInfoCellularGeneration {
  '2g' = '2g',
  '3g' = '3g',
  '4g' = '4g',
  '5g' = '5g',
}

export type NetInfoState = {
  type: NetInfoStateType;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: {isConnectionExpensive: boolean; cellularGeneration?: null; carrier?: null; ssid?: null; ipAddress?: string | null} | null;
  isWifiEnabled?: boolean;
};

export type NetInfoChangeHandler = (state: NetInfoState) => void;
export type NetInfoSubscription = () => void;
export type NetInfoConfiguration = Record<string, unknown>;

const TYPES: Record<NetworkState['type'], NetInfoStateType> = {NONE: NetInfoStateType.none, UNKNOWN: NetInfoStateType.unknown, CELLULAR: NetInfoStateType.cellular, WIFI: NetInfoStateType.wifi, ETHERNET: NetInfoStateType.ethernet, VPN: NetInfoStateType.vpn, OTHER: NetInfoStateType.other};

/** What the package answers before anything is known: unknown, and nothing to say. */
export const UNKNOWN: NetInfoState = {type: NetInfoStateType.unknown, isConnected: null, isInternetReachable: null, details: null};

/** The package's state for the runtime's: its type in the package's names, the details a connection has. */
export function stateOf(state: NetworkState): NetInfoState {
  const type = TYPES[state.type] ?? NetInfoStateType.unknown;
  if (!state.isConnected || type === NetInfoStateType.none || type === NetInfoStateType.unknown) {
    return {type, isConnected: state.isConnected, isInternetReachable: state.isConnected ? state.isInternetReachable : false, details: null};
  }
  return {type, isConnected: true, isInternetReachable: state.isInternetReachable, details: {isConnectionExpensive: type === NetInfoStateType.cellular}};
}

let configuration: NetInfoConfiguration = {};
let last: NetInfoState = UNKNOWN;

/** The reachability settings are kept, without effect: the profile says whether the internet is reachable. */
export function configure(next: Partial<NetInfoConfiguration>): void {
  configuration = {...configuration, ...next};
}

export function getConfiguration(): NetInfoConfiguration {
  return configuration;
}

export async function fetch(_requestedInterface?: string): Promise<NetInfoState> {
  const network = native.network();
  if (!network) return UNKNOWN;
  last = stateOf(await network.getState());
  return last;
}

export function refresh(): Promise<NetInfoState> {
  return fetch();
}

export function addEventListener(listener: NetInfoChangeHandler): NetInfoSubscription {
  const subscription: EmitterSubscription = DeviceEventEmitter.addListener('onNetworkStateChanged', (state: NetworkState) => {
    last = stateOf(state);
    listener(last);
  });
  void fetch().then(state => listener(state));
  return () => subscription.remove();
}

export function useNetInfo(_configuration?: Partial<NetInfoConfiguration>): NetInfoState {
  const [state, setState] = useState<NetInfoState>(last);
  useEffect(() => addEventListener(setState), []);
  return state;
}

export function useNetInfoInstance(_isPaused = false, _configuration?: Partial<NetInfoConfiguration>): {netInfo: NetInfoState; refresh: () => void} {
  const netInfo = useNetInfo();
  return {netInfo, refresh: () => void refresh()};
}

export default {configure, fetch, refresh, addEventListener, useNetInfo, useNetInfoInstance, NetInfoStateType, NetInfoCellularGeneration};
