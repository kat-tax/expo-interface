import {Platform, StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {byComposeTestID, host, modifier} from '../../jest/native';
import {Divider} from '.';

const isIOS = Platform.OS === 'ios';
const divider = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`Divider (${Platform.OS})`, () => {
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
      const {props} = host(p => Array.isArray(p.modifiers) && p.testID === undefined);
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
      expect(modifier(props, 'background')).toEqual({$type: 'background', color: '#FF9500'});
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
