import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
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

/** The Compose box, which the row may toggle in its place (Android only). */
const composeBox = () => host(p => 'nativeClickable' in p);

describe(`Checkbox (${Platform.OS})`, () => {
  it('renders the checked box with its label', async () => {
    await render(<Checkbox label="Remember me" value onValueChange={vi.fn()} testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'plain'});
      expect(modifier(props, 'disabled')).toBeUndefined();
      expect(host(p => p.text === 'Remember me')).toBeTruthy();
      expect(glyph().props.systemName).toBe('checkmark.square.fill');
      expect(modifier(glyph().props, 'font')?.size).toBe(22);
    } else {
      // The cover over the row is the one checkbox: no children, named by the
      // label, with the testID.
      expect(box('cb').type).toBe('ViewManagerAdapter_ExpoUI_BoxView');
      expect(props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['matchParentSize', 'toggleable', 'semantics', 'testID']);
      expect(modifier(props, 'toggleable')).toMatchObject({value: true, role: 'checkbox'});
      expect(modifier(props, 'semantics')).toEqual({$type: 'semantics', contentDescription: 'Remember me'});
      expect(props.children).toBeUndefined();
      const [around, row] = nodes();
      expect(around.props).toMatchObject({contentAlignment: 'centerStart', modifiers: [{$type: 'fillMaxWidth'}]});
      expect(row.props).toMatchObject({horizontalArrangement: 'spaceBetween', modifiers: [{$type: 'fillMaxWidth'}]});
      // The box under it only draws: no click, padded to its touch target's place.
      const {props: boxProps} = composeBox();
      expect(boxProps.value).toBe(true);
      expect(boxProps.enabled).toBe(true);
      expect(boxProps.nativeClickable).toBe(false);
      expect(boxProps.modifiers).toEqual([{$type: 'paddingAll', all: 12}]);
      expect(host(p => p.text === 'Remember me').props.color).toBe(palette.onSurface);
    }
  });

  it('renders the unchecked box in the label color', async () => {
    await render(<Checkbox label="Terms" value={false} onValueChange={vi.fn()} testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(glyph().props.systemName).toBe('square');
      expect(modifier(glyph().props, 'foregroundStyle')?.style.color).toBe('#000000');
    } else {
      expect(modifier(props, 'toggleable')?.value).toBe(false);
      expect(composeBox().props.value).toBe(false);
      expect(composeBox().props.colors.uncheckedColor).toBe(palette.onSurfaceVariant);
    }
  });

  it('tints the checked box with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Checkbox label="Sync" value onValueChange={vi.fn()} testID="cb"/>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      expect(modifier(glyph().props, 'foregroundStyle')?.style.color).toBe('#8959EA');
    } else {
      expect(composeBox().props.colors).toEqual({
        checkedColor: '#8959EA',
        checkmarkColor: '#FFFFFF',
        uncheckedColor: palette.onSurfaceVariant,
      });
    }
  });

  it('prefers an explicit accentColor over the seed', async () => {
    await render(<Checkbox label="Sync" value onValueChange={vi.fn()} accentColor="#FFCC00" testID="cb"/>, options);
    if (isIOS) {
      expect(modifier(glyph().props, 'foregroundStyle')?.style.color).toBe('#FFCC00');
    } else {
      expect(composeBox().props.colors.checkedColor).toBe('#FFCC00');
      expect(composeBox().props.colors.checkmarkColor).toBe('#000000');
    }
  });

  it('disables the control', async () => {
    const onValueChange = vi.fn();
    await render(<Checkbox label="Updates" value onValueChange={onValueChange} disabled testID="cb"/>, options);
    const {props} = box('cb');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(host(p => p.text === 'Updates').props, 'foregroundStyle')?.style.color).toBe('#60646C');
    } else {
      // Disabled, the cover is a toggleable surface that is not enabled, carrying
      // the `toggleable` for the role, named by the label, with the testID.
      expect(box('cb').type).toBe('ViewManagerAdapter_ExpoUI_SurfaceView');
      expect(props).toMatchObject({checked: true, enabled: false, color: '#00000000', contentColor: '#00000000'});
      expect(modifier(props, 'toggleable')).toMatchObject({value: true, role: 'checkbox'});
      expect(modifier(props, 'semantics')).toEqual({$type: 'semantics', contentDescription: 'Updates'});
      expect(composeBox().props).toMatchObject({enabled: false, nativeClickable: false});
      expect(host(p => p.text === 'Updates').props.color).toBe(palette.onSurfaceVariant);
      // `@expo/ui` wires every handler; none reaches the app.
      await act(async () => {
        props.onCheckedChange({nativeEvent: {value: false}});
        modifier(props, 'toggleable')!.eventListener();
      });
      expect(onValueChange).not.toHaveBeenCalled();
    }
  });

  it('renders only the box without a label', async () => {
    await render(<Checkbox value={false} onValueChange={vi.fn()} testID="cb"/>, options);
    if (isIOS) {
      expect(screen.getByTestId('cb').children).toHaveLength(1);
      expect(nodes().some(n => n.props.spacing === 8)).toBe(false);
    } else {
      expect(nodes()).toHaveLength(1);
      expect(box('cb').props.value).toBe(false);
    }
  });

  it('reports the toggled value', async () => {
    const onValueChange = vi.fn();
    await render(<Checkbox label="Terms" value={false} onValueChange={onValueChange} testID="cb"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('cb'), 'buttonPress');
    } else {
      await act(async () => {
        modifier(box('cb').props, 'toggleable')?.eventListener();
      });
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  (isIOS ? it.skip : it)('toggles from the labelled row itself', async () => {
    const onValueChange = vi.fn();
    await render(<Checkbox label="Terms" value={false} onValueChange={onValueChange} testID="cb"/>, options);
    const row = host(p => modifier(p, 'toggleable') != null);
    await act(async () => {
      modifier(row.props, 'toggleable')?.eventListener();
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  (isIOS ? it.skip : it)('makes an unlabelled box the control, enabled or disabled, with the testID', async () => {
    const onValueChange = vi.fn();
    const {rerender} = await render(<Checkbox value={false} onValueChange={onValueChange} testID="cb"/>, options);
    expect(box('cb').props).toMatchObject({enabled: true, nativeClickable: true});
    expect(modifier(box('cb').props, 'semantics')).toBeUndefined();
    await act(async () => {
      box('cb').props.onCheckedChange({nativeEvent: {value: true}});
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
    // Disabled, it is still a checkbox: handed a click Compose never fires while it is disabled.
    await rerender(<Checkbox value={false} onValueChange={onValueChange} disabled testID="cb"/>);
    expect(box('cb').props).toMatchObject({enabled: false, nativeClickable: true});
    await act(async () => {
      box('cb').props.onCheckedChange({nativeEvent: {value: true}});
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  (isIOS ? it.skip : it)('carries no testID modifier without a testID', async () => {
    await render(<Checkbox value onValueChange={vi.fn()}/>, options);
    expect(nodes()[0].props.modifiers).toEqual([]);
  });
});
