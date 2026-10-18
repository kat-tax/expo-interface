import {Platform, StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {Switch} from '../switch';
import {host, modifier, nodes} from 'expo-vitest/native';
import {NativeHost} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

describe(`NativeHost (${Platform.OS})`, () => {
  it('mounts an accent-seeded host sized to its content vertically by default', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <NativeHost style={{margin: 4}}>
          <Switch label="Wi-Fi" value onValueChange={() => {}}/>
        </NativeHost>
      </AccentProvider>,
    );
    const hostView = nodes().find(n => n.type === HOST)!;
    // A block that fills its container, since `@expo/ui`'s host hugs its
    // content on web as soon as `matchContents` is set on either axis.
    expect(StyleSheet.flatten(hostView.props.style)).toEqual({alignSelf: 'stretch', margin: 4});
    // Both native hosts split `matchContents` into one prop per axis.
    expect(hostView.props.matchContentsVertical).toBe(true);
    expect(hostView.props.matchContentsHorizontal).toBeFalsy();
    if (Platform.OS === 'ios') {
      expect(modifier(hostView.props, 'tint')?.tint.color).toBe('#8959EA');
      expect(host(p => p.label === 'Wi-Fi')).toBeTruthy();
    } else {
      expect(hostView.props.seedColor).toBe('#8959EA');
      expect(host(p => p.text === 'Wi-Fi')).toBeTruthy();
    }
  });

  it('sizes to its content on both axes with fit', async () => {
    await render(
      <NativeHost fit>
        <Switch value onValueChange={() => {}}/>
      </NativeHost>,
    );
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView.props.matchContentsVertical).toBe(true);
    expect(hostView.props.matchContentsHorizontal).toBe(true);
  });

  it('sizes to its width alone with fit="width", for a rule that stands in a row', async () => {
    await render(
      <NativeHost fit="width">
        <Switch value onValueChange={() => {}}/>
      </NativeHost>,
    );
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView.props.matchContentsHorizontal).toBe(true);
    expect(hostView.props.matchContentsVertical).toBeFalsy();
    expect(StyleSheet.flatten(hostView.props.style)).toEqual({alignSelf: 'stretch'});
  });

  it('matches nothing with fit="fill", taking the size its layout gives, for content that scrolls', async () => {
    await render(
      <NativeHost fit="fill">
        <Switch value onValueChange={() => {}}/>
      </NativeHost>,
    );
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView.props.matchContentsHorizontal).toBeFalsy();
    expect(hostView.props.matchContentsVertical).toBeFalsy();
    expect(StyleSheet.flatten(hostView.props.style)).toEqual({flex: 1, alignSelf: 'stretch'});
  });

  it('lays its children out as one native row or column when asked', async () => {
    await render(
      <>
        <NativeHost fit direction="row" spacing={8}>
          <Switch value onValueChange={() => {}}/>
          <Switch value={false} onValueChange={() => {}}/>
        </NativeHost>
        <NativeHost direction="column" spacing={4}>
          <Switch value onValueChange={() => {}}/>
        </NativeHost>
      </>,
    );
    if (Platform.OS === 'ios') {
      expect(host(p => p.spacing === 8 && p.alignment === 'center')).toBeTruthy();
      expect(host(p => p.spacing === 4)).toBeTruthy();
    } else {
      expect(host(p => p.horizontalArrangement?.spacedBy === 8 && p.verticalAlignment === 'center')).toBeTruthy();
      expect(host(p => p.verticalArrangement?.spacedBy === 4)).toBeTruthy();
    }
  });
});
