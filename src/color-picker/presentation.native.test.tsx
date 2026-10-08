import type {PropsWithChildren} from 'react';
import type {ColorPickerSheetProps} from './sheet';
import type {HostNode} from 'expo-vitest/native';
import {Platform, processColor} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {ColorPicker} from '.';

/** The picker panel, stubbed: its props are what the tests read and drive (sheet.native.test.tsx covers it). */
let sheetProps: ColorPickerSheetProps | undefined;
vi.mock('./sheet', () => ({
  ColorPickerSheet: (props: ColorPickerSheetProps) => {
    sheetProps = props;
    return null;
  },
}));

const isIOS = Platform.OS === 'ios';
const palette: Partial<MaterialColors> = {onSurface: '#1B1B1FFF', onSurfaceVariant: '#45464FFF'};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};
/** The host instances a SwiftUI modifier names, to press. */
const labelled = (label: string) => screen.container.queryAll(i => modifier(i.props, 'accessibilityLabel')?.label === label);
/** Fires the Compose `clickable` modifier of a node. */
const tap = async (node: HostNode) => {
  await act(async () => {
    modifier(node.props, 'clickable')?.eventListener();
  });
};
const ofType = (name: string) => nodes().filter(n => n.type.includes(name));

beforeEach(() => {
  sheetProps = undefined;
});

describe(`ColorPicker presentations (${Platform.OS})`, () => {
  if (isIOS) {
    it('offers No color beside the system palette, and hands the well no color for an empty value', async () => {
      const onValueChange = vi.fn();
      await render(<ColorPicker label="Fill" value="" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>, options);
      expect(labelled('Color Red').length).toBeGreaterThan(0);
      await fireEvent.press(labelled('No color')[0]);
      expect(onValueChange).toHaveBeenLastCalledWith('');
      expect(screen.getByTestId('cp-well').props.selection).toBe(processColor('#00000000'));
      // No color is ringed, crossed out by a turned stroke.
      expect(nodes().some(n => modifier(n.props, 'rotationEffect'))).toBe(true);
      await fireEvent.press(labelled('Color Blue')[0]);
      expect(onValueChange).toHaveBeenLastCalledWith('#007AFFFF');
    });

    it('opens SwiftUI\'s own menu of the swatches from a well', async () => {
      const {rerender} = await render(<ColorPicker label="Ink" value="#FF3B30" presentation="menu" swatches="system" allowsNone onValueChange={vi.fn()} testID="cp"/>, options);
      const menu = screen.getByTestId('cp-well');
      expect(menu.type).toContain('Menu');
      expect(modifier(menu.props, 'accessibilityLabel')?.label).toBe('Ink');
      // The well's label: a ring around the color.
      expect(nodes().some(n => modifier(n.props, 'frame')?.width === 24)).toBe(true);
      await rerender(<ColorPicker value="" presentation="menu" onValueChange={vi.fn()} testID="cp"/>);
      expect(modifier(screen.getByTestId('cp-well').props, 'accessibilityLabel')?.label).toBe('Color');
      expect(nodes().some(n => modifier(n.props, 'rotationEffect'))).toBe(true);
      // Without a testID the menu carries none.
      await rerender(<ColorPicker value="#FF3B30" presentation="menu" onValueChange={vi.fn()}/>);
      expect(nodes().some(n => n.props.testID != null)).toBe(false);
    });

    it('names its own swatches as given, in the row and in the menu', async () => {
      const onValueChange = vi.fn();
      const swatches = [{color: '#1D1D1F', name: 'Ink'}, '#FF0000'];
      const {rerender} = await render(<ColorPicker value="#FF0000" swatches={swatches} onValueChange={onValueChange}/>, options);
      expect(labelled('Color #FF0000').length).toBeGreaterThan(0);
      await fireEvent.press(labelled('Color Ink')[0]);
      expect(onValueChange).toHaveBeenLastCalledWith('#1D1D1FFF');
      // The menu's entries carry the names, the label aside.
      await rerender(<ColorPicker label="Pen" value="#FF0000" presentation="menu" swatches={swatches} onValueChange={onValueChange}/>);
      expect(host(p => p.text === 'Ink')).toBeTruthy();
      expect(host(p => p.text === '#FF0000')).toBeTruthy();
    });

    it('keeps the row for inline and popover, where SwiftUI presents its picker its own way', async () => {
      await render(<ColorPicker value="#FF0000" presentation="inline" onValueChange={vi.fn()} testID="cp"/>, options);
      expect(screen.getByTestId('cp').props.selection).toBe(processColor('#FF0000'));
      expect(sheetProps).toBeUndefined();
    });
    return;
  }

  it('draws the picker in place in a hosted view, the presets over it', async () => {
    const {rerender} = await render(<ColorPicker label="Ink" value="#FF0000" presentation="inline" swatches={['#FF0000']} allowsNone onValueChange={vi.fn()} testID="cp"/>, options);
    expect(sheetProps).toMatchObject({title: 'Ink'});
    expect(sheetProps!.onClose).toBeUndefined();
    expect(byComposeTestID('cp-swatch-none')).toBeTruthy();
    expect(byComposeTestID('cp-swatch-#FF0000')).toBeTruthy();
    await rerender(<ColorPicker value="#FF0000" presentation="inline" onValueChange={vi.fn()}/>);
    expect(ofType('FlowRow')).toHaveLength(0);
  });

  it('opens the picker in a dialog for popover, and closes it from the picker or the dialog', async () => {
    await render(<ColorPicker label="Ink" value="#FF0000" presentation="popover" onValueChange={vi.fn()} testID="cp"/>, options);
    expect(ofType('BasicAlertDialog')).toHaveLength(0);
    await tap(byComposeTestID('cp'));
    expect(ofType('BasicAlertDialog')).toHaveLength(1);
    expect(ofType('ModalBottomSheet')).toHaveLength(0);
    await act(async () => sheetProps?.onClose?.());
    expect(ofType('BasicAlertDialog')).toHaveLength(0);
    await tap(byComposeTestID('cp'));
    const [dialog] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(dialog, 'dismissRequest');
    expect(ofType('BasicAlertDialog')).toHaveLength(0);
  });

  it('opens a Material menu of the swatches from the well', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker label="Ink" value="#F44336" presentation="menu" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>, options);
    expect(ofType('DropdownMenu')[0].props.expanded).toBe(false);
    await tap(byComposeTestID('cp'));
    expect(ofType('DropdownMenu')[0].props.expanded).toBe(true);
    const entries = screen.container.queryAll(i => typeof i.props.onItemPressed === 'function');
    expect(entries).toHaveLength(13);
    await fireEvent(entries[2], 'itemPressed');
    expect(onValueChange).toHaveBeenLastCalledWith('#E91E63FF');
    await tap(byComposeTestID('cp'));
    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(ofType('DropdownMenu')[0].props.expanded).toBe(false);
  });

  it('offers No color beside the palette, and crosses out the well for an empty value', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker value="" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>, options);
    await tap(byComposeTestID('cp-swatch-none'));
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(byComposeTestID('cp-swatch-#F44336')).toBeTruthy();
    expect(nodes().filter(n => modifier(n.props, 'rotate'))).toHaveLength(2);
  });
});
