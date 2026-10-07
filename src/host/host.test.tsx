import {Platform, StyleSheet} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {render} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {Switch} from '../switch';
import {host, modifier, nodes} from 'expo-vitest/native';
import {NativeHost} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

describe(`NativeHost (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('renders a view carrying the @expo/ui palette around its content', () => {
      renderDom(
        <NativeHost fit>
          <Switch label="Wi-Fi" value onValueChange={() => {}}/>
        </NativeHost>,
      );
      const hostView = dom.getByText('Wi-Fi').parentElement!.parentElement!;
      expect(hostView.style.getPropertyValue('--expo-ui-primary-500')).not.toBe('');
      expect(dom.getByRole('switch')).toBeTruthy();
    });

    it('hugs its content by size, leaving the alignment to the row it is in', () => {
      const {container} = renderDom(<NativeHost fit/>);
      const style = getComputedStyle(container.firstElementChild!);
      // The universal host hugs with `align-self: flex-start`, which also
      // pins it to the top of a row that centres its children — where iOS and
      // Android centre it. A definite cross size hugs without saying where:
      // measured in Chromium, this sits at y 15..42 of a 56-high centred row
      // where `flex-start` sat at 0..27, and is still unstretched (0..27,
      // 27 high) in a row with no alignment of its own.
      expect(style.alignSelf).toBe('auto');
      expect(style.width).toBe('fit-content');
      expect(style.height).toBe('fit-content');
    });

    it('fills its container across the axis it does not hug', () => {
      const {container} = renderDom(<NativeHost/>);
      // Without `fit` the host is a block, as it is natively, so the universal
      // host's hug has to be undone rather than replaced.
      expect(getComputedStyle(container.firstElementChild!).alignSelf).toBe('stretch');
    });

    it('lets a caller place it themselves', () => {
      const {container} = renderDom(<NativeHost fit style={{alignSelf: 'flex-end'}}/>);
      expect(getComputedStyle(container.firstElementChild!).alignSelf).toBe('flex-end');
    });

    it('hugs its width alone with fit="width", the height being the row\'s', () => {
      const {container} = renderDom(<NativeHost fit="width"/>);
      const style = getComputedStyle(container.firstElementChild!);
      expect(style.width).toBe('fit-content');
      expect(style.alignSelf).toBe('stretch');
    });

    it('takes the size its layout gives on both axes with fit="fill", for content that scrolls', () => {
      const {container} = renderDom(<NativeHost fit="fill"/>);
      const style = getComputedStyle(container.firstElementChild!);
      expect(style.flexGrow).toBe('1');
      expect(style.alignSelf).toBe('stretch');
      expect(style.width).not.toBe('fit-content');
    });

    it('lays its children out as one row or column when asked', () => {
      const {container} = renderDom(
        <NativeHost direction="row" spacing={8}>
          <span>A</span>
          <span>B</span>
        </NativeHost>,
      );
      const row = container.querySelector('span')!.parentElement!;
      expect(getComputedStyle(row).flexDirection).toBe('row');
      expect(getComputedStyle(row).gap).toBe('8px');
    });
    return;
  }

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
