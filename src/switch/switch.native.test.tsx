import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {Switch} from '.';

const isIOS = Platform.OS === 'ios';
const toggle = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

describe(`Switch (${Platform.OS})`, () => {
  it('renders the native toggle with its label', async () => {
    await render(<Switch label="Wi-Fi" value onValueChange={vi.fn()} testID="sw"/>, options);
    const {props} = toggle('sw');
    if (isIOS) {
      expect(props.label).toBe('Wi-Fi');
      expect(props.isOn).toBe(true);
      expect(props.modifiers).toEqual([]);
    } else {
      expect(props.value).toBe(true);
      expect(props.enabled).toBe(true);
      expect(props.colors).toEqual({checkedTrackColor: '#007AFF', checkedThumbColor: '#FFFFFF'});
      expect(modifier(props, 'graphicsLayer')).toMatchObject({scaleX: 0.8, scaleY: 0.8, transformOriginX: 1});
      const row = nodes()[0];
      expect(row.props.horizontalArrangement).toBe('spaceBetween');
      expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
      expect(host(p => p.text === 'Wi-Fi').props.color).toBe(palette.onSurface);
    }
  });

  it('follows the accent seed and an explicit accentColor', async () => {
    const {rerender} = await render(
      <AccentProvider seed="#8959EA">
        <Switch value onValueChange={vi.fn()} testID="sw"/>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      // The Host `tint` cascade colors it; no per-instance modifier is emitted.
      expect(modifier(toggle('sw').props, 'tint')).toBeUndefined();
    } else {
      expect(toggle('sw').props.colors.checkedTrackColor).toBe('#8959EA');
    }
    await rerender(<Switch value onValueChange={vi.fn()} accentColor="#FF9500" testID="sw"/>);
    if (isIOS) {
      expect(modifier(toggle('sw').props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
    } else {
      expect(toggle('sw').props.colors.checkedTrackColor).toBe('#FF9500');
    }
  });

  it('disables the control', async () => {
    const onValueChange = vi.fn();
    await render(<Switch label="Bluetooth" value={false} onValueChange={onValueChange} disabled testID="sw"/>, options);
    const {props} = toggle('sw');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.enabled).toBe(false);
      // `@expo/ui` always wires the change handler; the control drops its own callback.
      await act(async () => {
        props.onCheckedChange({nativeEvent: {value: true}});
      });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(host(p => p.text === 'Bluetooth').props.color).toBe(palette.onSurfaceVariant);
    }
  });

  it('renders only the toggle without a label or testID', async () => {
    await render(<Switch value={false} onValueChange={vi.fn()}/>, options);
    expect(nodes()).toHaveLength(1);
    if (!isIOS) {
      expect(modifier(nodes()[0].props, 'testID')).toBeUndefined();
      expect(modifier(nodes()[0].props, 'graphicsLayer')).toBeDefined();
    }
  });

  it('reports the toggled value', async () => {
    const onValueChange = vi.fn();
    await render(<Switch label="Wi-Fi" value={false} onValueChange={onValueChange} testID="sw"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('sw'), 'isOnChange', {nativeEvent: {isOn: true}});
    } else {
      await act(async () => {
        toggle('sw').props.onCheckedChange({nativeEvent: {value: true}});
      });
    }
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
