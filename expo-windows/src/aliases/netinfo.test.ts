import type {NativeNetwork, NetworkState} from '../native';
import {act, renderHook} from '@testing-library/react-native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import NetInfo, {addEventListener, configure, fetch, getConfiguration, NetInfoCellularGeneration, NetInfoStateType, refresh, stateOf, UNKNOWN, useNetInfo, useNetInfoInstance} from './netinfo';

const ETHERNET: NetworkState = {type: 'ETHERNET', isConnected: true, isInternetReachable: true};

function withNetwork(state: NetworkState = ETHERNET) {
  const network: NativeNetwork = {getState: vi.fn(async () => state), getIpAddress: vi.fn(async () => '10.0.0.2')};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsNetwork' ? network : null) as never);
  return network;
}

describe('@react-native-community/netinfo (windows)', () => {
  it('maps the runtime\'s state onto the package\'s: type names, connection details, unknown and none', () => {
    expect(stateOf(ETHERNET)).toEqual({type: 'ethernet', isConnected: true, isInternetReachable: true, details: {isConnectionExpensive: false}});
    expect(stateOf({type: 'CELLULAR', isConnected: true, isInternetReachable: false})).toEqual({type: 'cellular', isConnected: true, isInternetReachable: false, details: {isConnectionExpensive: true}});
    expect(stateOf({type: 'WIFI', isConnected: false, isInternetReachable: false})).toEqual({type: 'wifi', isConnected: false, isInternetReachable: false, details: null});
    expect(stateOf({type: 'NONE', isConnected: false, isInternetReachable: false})).toEqual({type: 'none', isConnected: false, isInternetReachable: false, details: null});
    expect(stateOf({type: 'UNKNOWN', isConnected: true, isInternetReachable: true})).toEqual({type: 'unknown', isConnected: true, isInternetReachable: true, details: null});
    expect(stateOf({type: 'MYSTERY' as never, isConnected: true, isInternetReachable: true}).type).toBe('unknown');
    expect(NetInfoStateType.vpn).toBe('vpn');
    expect(NetInfoCellularGeneration['5g']).toBe('5g');
    expect(NetInfo).toMatchObject({fetch, refresh, addEventListener, useNetInfo, useNetInfoInstance, NetInfoStateType});
  });

  it('fetches and refreshes through the library, and answers unknown without it', async () => {
    withNetwork();
    await expect(fetch('wifi')).resolves.toMatchObject({type: 'ethernet', isConnected: true});
    await expect(refresh()).resolves.toMatchObject({type: 'ethernet'});
    configure({reachabilityUrl: 'https://x/'});
    expect(getConfiguration()).toEqual({reachabilityUrl: 'https://x/'});
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(fetch()).resolves.toBe(UNKNOWN);
  });

  it('listens for the library\'s status event, telling the current state first', async () => {
    withNetwork();
    const heard: unknown[] = [];
    const unsubscribe = addEventListener(state => heard.push(state));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(heard).toEqual([expect.objectContaining({type: 'ethernet'})]);
    DeviceEventEmitter.emit('onNetworkStateChanged', {type: 'WIFI', isConnected: true, isInternetReachable: false});
    expect(heard[1]).toMatchObject({type: 'wifi', isInternetReachable: false});
    unsubscribe();
    DeviceEventEmitter.emit('onNetworkStateChanged', {type: 'NONE', isConnected: false, isInternetReachable: false});
    expect(heard).toHaveLength(2);
  });

  it('gives the hooks the state as it changes, with a refresh of their own', async () => {
    withNetwork({type: 'VPN', isConnected: true, isInternetReachable: true});
    const {result, unmount} = await renderHook(() => useNetInfo());
    await act(async () => {});
    expect(result.current).toMatchObject({type: 'vpn', isConnected: true});
    await act(async () => {
      DeviceEventEmitter.emit('onNetworkStateChanged', {type: 'NONE', isConnected: false, isInternetReachable: false});
    });
    expect(result.current).toMatchObject({type: 'none', isConnected: false});
    await unmount();
    const instance = await renderHook(() => useNetInfoInstance());
    await act(async () => {});
    expect(instance.result.current.netInfo).toMatchObject({type: 'vpn'});
    instance.result.current.refresh();
    await act(async () => {});
    await instance.unmount();
  });
});
