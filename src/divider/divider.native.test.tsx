import {Platform, StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {byComposeTestID, host, modifier} from 'expo-vitest/native';
import {hostFit, hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {Divider} from '.';

const isIOS = Platform.OS === 'ios';
const divider = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`Divider (${Platform.OS})`, () => {
  it('mounts a host of its own outside one: the container\'s width, or the row\'s height for a vertical rule', async () => {
    await render(<Divider testID="rule"/>);
    expect(hosts()).toHaveLength(1);
    expect(hostFit(hosts()[0])).toEqual({vertical: true});
    await render(<Divider vertical testID="upright"/>);
    expect(hostFit(hosts()[0])).toEqual({horizontal: true});
    await render(
      <NativeHostContext.Provider value={true}>
        <Divider testID="inside"/>
      </NativeHostContext.Provider>,
    );
    expect(hosts()).toHaveLength(0);
    expect(divider('inside')).toBeTruthy();
  });

  it('gives a vertical rule inside a host a length of its own on Android, where Compose has no row height for it to fill', async () => {
    await render(
      <NativeHostContext.Provider value={true}>
        <Divider vertical inset={4} testID="hosted"/>
        <Divider testID="across"/>
      </NativeHostContext.Provider>,
    );
    const hosted = divider('hosted').props;
    const across = divider('across').props;
    if (isIOS) {
      // SwiftUI's Divider takes the height of the HStack it is in.
      expect(modifier(hosted, 'frame')).toBeUndefined();
    } else {
      // Before the inset, which is taken from the length.
      expect((hosted.modifiers as {$type: string}[]).map(m => m.$type)).toEqual(['height', 'padding', 'testID']);
      expect(modifier(hosted, 'height')).toEqual({$type: 'height', height: 24});
      expect(modifier(across, 'height')).toBeUndefined();
    }
    // Outside a host it is its own host's height, which is the row's.
    await render(<Divider vertical testID="alone"/>);
    expect(modifier(divider('alone').props, 'height')).toBeUndefined();
  });

  it('renders the native divider with the theme separator color', async () => {
    await render(<Divider testID="rule"/>);
    const {props} = divider('rule');
    if (isIOS) {
      // SwiftUI dividers take the system separator color; no modifiers by default.
      expect(props.modifiers).toEqual([]);
    } else {
      expect(props.color).toBe(colors.light.separator);
      expect(props.thickness).toBe(StyleSheet.hairlineWidth);
    }
  });

  it('renders without a testID', async () => {
    await render(<Divider/>);
    if (isIOS) {
      const {props} = host(p => Array.isArray(p.modifiers) && p.testID === undefined && !p.matchContentsVertical);
      expect(props.modifiers).toEqual([]);
    } else {
      const {props} = host(p => p.thickness === StyleSheet.hairlineWidth);
      expect(props.modifiers).toEqual([]);
    }
  });

  it('paints a custom color', async () => {
    await render(<Divider color="#FF9500" testID="rule"/>);
    const {props} = divider('rule');
    if (isIOS) {
      expect(modifier(props, 'background')).toEqual({$type: 'background', style: {type: 'color', color: '#FF9500'}});
    } else {
      expect(props.color).toBe('#FF9500');
    }
  });

  it('insets a horizontal rule from the leading edge', async () => {
    await render(<Divider inset={16} testID="rule"/>);
    const {props} = divider('rule');
    if (isIOS) {
      expect(modifier(props, 'padding')).toEqual({$type: 'padding', leading: 16});
    } else {
      expect(modifier(props, 'padding')).toEqual({$type: 'padding', start: 16, top: 0, end: 0, bottom: 0});
    }
  });

  it('insets a vertical rule from the top edge', async () => {
    await render(<Divider vertical inset={8} testID="rule"/>);
    const {props} = divider('rule');
    if (isIOS) {
      expect(modifier(props, 'padding')).toEqual({$type: 'padding', top: 8});
    } else {
      expect(modifier(props, 'padding')).toEqual({$type: 'padding', start: 0, top: 8, end: 0, bottom: 0});
    }
  });

  it('orders inset before color so the padding wraps the painted rule', async () => {
    await render(<Divider inset={12} color="#0000FF" testID="rule"/>);
    const {props} = divider('rule');
    const types = (props.modifiers as {$type: string}[]).map(m => m.$type);
    if (isIOS) {
      expect(types).toEqual(['padding', 'background']);
    } else {
      expect(types).toEqual(['padding', 'testID']);
      expect(props.color).toBe('#0000FF');
    }
  });
});
