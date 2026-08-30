import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes} from '../../jest/native';
import {Checkbox} from '.';

const isIOS = Platform.OS === 'ios';
const box = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

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

/** The SwiftUI glyph rendered for the box (iOS only). */
const glyph = () => host(p => typeof p.systemName === 'string');

describe(`Checkbox (${Platform.OS})`, () => {
  it('renders the checked box with its label', async () => {
    await render(<Checkbox label="Remember me" value onValueChange={jest.fn()} testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'plain'});
      expect(modifier(props, 'disabled')).toBeUndefined();
      expect(host(p => p.text === 'Remember me')).toBeTruthy();
      expect(glyph().props.systemName).toBe('checkmark.square.fill');
      expect(modifier(glyph().props, 'font')?.size).toBe(22);
    } else {
      expect(props.value).toBe(true);
      expect(props.enabled).toBe(true);
      expect(props.nativeClickable).toBe(true);
      expect(host(p => p.text === 'Remember me').props.color).toBe(palette.onSurface);
      const row = host(p => modifier(p, 'toggleable') != null);
      expect(modifier(row.props, 'toggleable')).toMatchObject({value: true, role: 'checkbox'});
      expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
    }
  });

  it('renders the unchecked box in the label color', async () => {
    await render(<Checkbox label="Terms" value={false} onValueChange={jest.fn()} testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(glyph().props.systemName).toBe('square');
      expect(modifier(glyph().props, 'foregroundStyle')?.color).toBe('#000000');
    } else {
      expect(props.value).toBe(false);
      expect(props.colors.uncheckedColor).toBe(palette.onSurfaceVariant);
    }
  });

  it('tints the checked box with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Checkbox label="Sync" value onValueChange={jest.fn()} testID="cb"/>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      expect(modifier(glyph().props, 'foregroundStyle')?.color).toBe('#8959EA');
    } else {
      expect(box('cb').props.colors).toEqual({
        checkedColor: '#8959EA',
        checkmarkColor: '#FFFFFF',
        uncheckedColor: palette.onSurfaceVariant,
      });
    }
  });

  it('prefers an explicit accentColor over the seed', async () => {
    await render(<Checkbox label="Sync" value onValueChange={jest.fn()} accentColor="#FFCC00" testID="cb"/>, options);
    if (isIOS) {
      expect(modifier(glyph().props, 'foregroundStyle')?.color).toBe('#FFCC00');
    } else {
      expect(box('cb').props.colors.checkedColor).toBe('#FFCC00');
      expect(box('cb').props.colors.checkmarkColor).toBe('#000000');
    }
  });

  it('disables the control', async () => {
    await render(<Checkbox label="Updates" value onValueChange={jest.fn()} disabled testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(host(p => p.text === 'Updates').props, 'foregroundStyle')?.color).toBe('#60646C');
    } else {
      expect(props.enabled).toBe(false);
      expect(props.nativeClickable).toBe(false);
      expect(host(p => p.text === 'Updates').props.color).toBe(palette.onSurfaceVariant);
      expect(nodes().some(n => modifier(n.props, 'toggleable') != null)).toBe(false);
    }
  });

  it('renders only the box without a label', async () => {
    await render(<Checkbox value={false} onValueChange={jest.fn()} testID="cb"/>, options);
    if (isIOS) {
      expect(screen.getByTestId('cb').children).toHaveLength(1);
      expect(nodes().some(n => n.props.spacing === 8)).toBe(false);
    } else {
      expect(nodes()).toHaveLength(1);
      expect(box('cb').props.value).toBe(false);
    }
  });

  it('reports the toggled value', async () => {
    const onValueChange = jest.fn();
    await render(<Checkbox label="Terms" value={false} onValueChange={onValueChange} testID="cb"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('cb'), 'buttonPress');
    } else {
      await act(async () => {
        box('cb').props.onCheckedChange({nativeEvent: {value: true}});
      });
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
