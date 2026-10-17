import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes, type HostNode} from 'expo-vitest/native';
import {Picker} from '.';

const isIOS = Platform.OS === 'ios';

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
  surfaceContainerHighest: '#E6E0E9FF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

const items = [
  <Picker.Item key="s" label="Small" value="s"/>,
  <Picker.Item key="m" label="Medium" value="m"/>,
  <Picker.Item key="l" label="Large" value="l"/>,
];

/** SwiftUI picker options as `[text, tag]` pairs (iOS only). */
const tags = () => nodes().filter(n => modifier(n.props, 'tag')).map(n => [n.props.text, modifier(n.props, 'tag')?.tag]);

/** The Compose pills that draw the value (Android only): the one under the anchor holding its place, and the one over it, read. */
const pills = () => nodes().filter(n => modifier(n.props, 'background') != null);
const pill = () => pills()[1];

/** The Compose node of an `@expo/ui` view (Android only). */
function view(name: string): HostNode {
  const match = nodes().find(n => n.type === `ViewManagerAdapter_ExpoUI_${name}View`);
  if (!match) throw new Error(`No ${name} rendered`);
  return match;
}

/** The rows the box lays over one another: the label under the anchor, and the value over it (Android only). */
const rows = () => nodes(dropdown()).filter(n => n.type === 'ViewManagerAdapter_ExpoUI_RowView' && modifier(n.props, 'fillMaxWidth') != null);

/** Material's exposed drop-down box, its anchor (the row) and its menu (Android only). */
const dropdown = () => view('ExposedDropdownMenuBox');
const anchor = () => view('Surface');
const menu = () => view('ExposedDropdownMenu');

/** The anchor's press, which the box reports as a request to expand (Android only). */
async function press() {
  await act(async () => {
    dropdown().props.onExpandedChange({nativeEvent: {value: true}});
  });
}

/** The Compose dropdown menu item whose text slot renders `label` (Android only). */
function menuItem(label: string): HostNode {
  const match = nodes(menu()).find(n => n.type === 'ViewManagerAdapter_ExpoUI_DropdownMenuItemView' && nodes(n).some(c => c.props.text === label));
  if (!match) throw new Error(`No menu item labelled ${label}`);
  return match;
}

describe(`Picker (${Platform.OS})`, () => {
  (isIOS ? it.skip : it)('carries the testID as a Compose modifier', async () => {
    await render(<Picker selectedValue="m" testID="pk">{items}</Picker>, options);
    // On the anchor, the control a screen reader is handed, not the column around it.
    expect(byComposeTestID('pk').type).toBe('ViewManagerAdapter_ExpoUI_SurfaceView');
  });

  it('renders the native picker with its label and items', async () => {
    await render(<Picker label="Size" selectedValue="m" onValueChange={vi.fn()} testID="pk">{items}</Picker>, options);
    if (isIOS) {
      const {props} = screen.getByTestId('pk');
      expect(props.label).toBe('Size');
      expect(props.selection).toBe('m');
      expect(modifier(props, 'pickerStyle')).toEqual({$type: 'pickerStyle', style: 'menu'});
      expect(modifier(props, 'tint')).toBeUndefined();
      expect(modifier(props, 'disabled')).toBeUndefined();
      expect(tags()).toEqual([['Small', 's'], ['Medium', 'm'], ['Large', 'l']]);
    } else {
      expect(host(p => p.text === 'Size').props.color).toBe(palette.onSurface);
      expect(dropdown().props.expanded).toBe(false);
      expect(modifier(dropdown().props, 'fillMaxWidth')).toBeDefined();
      expect(menu().props.expanded).toBe(false);
      // The anchor is a clear clickable surface with no children, laid over
      // the row between the label and the value, and named by the label.
      expect(anchor().props).toMatchObject({color: '#00000000', enabled: true, clickable: true});
      expect(anchor().props.modifiers).toEqual([
        {$type: 'menuAnchor', type: 'primaryNotEditable'},
        {$type: 'fillMaxWidth'},
        {$type: 'semantics', contentDescription: 'Size'},
        {$type: 'testID', testID: 'pk'},
      ]);
      expect(anchor().props.children).toBeUndefined();
      const [under, over] = rows();
      // Drawn in this order: the label's row, the anchor, the value's row.
      const order = nodes(dropdown());
      const underAt = order.findIndex(n => modifier(n.props, 'onSizeChanged') != null);
      const anchorAt = order.findIndex(n => n.type === 'ViewManagerAdapter_ExpoUI_SurfaceView');
      const overAt = order.findIndex(n => n.props.horizontalArrangement === 'end');
      expect(underAt).toBeGreaterThanOrEqual(0);
      expect(underAt).toBeLessThan(anchorAt);
      expect(anchorAt).toBeLessThan(overAt);
      expect(nodes(under).some(n => n.props.text === 'Size')).toBe(true);
      expect(under.props.horizontalArrangement).toBe('spaceBetween');
      expect(over.props).toMatchObject({horizontalArrangement: 'end', modifiers: [{$type: 'fillMaxWidth'}]});
      // The value under the anchor only holds its place; the one over it is drawn and read.
      expect(pills()).toHaveLength(2);
      expect(modifier(pills()[0].props, 'alpha')).toEqual({$type: 'alpha', alpha: 0});
      expect(modifier(pill().props, 'alpha')).toBeUndefined();
      expect(nodes(over).some(n => modifier(n.props, 'background') != null && modifier(n.props, 'alpha') == null)).toBe(true);
      // The anchor and the value take the height the row under them reports.
      await act(async () => modifier(under.props, 'onSizeChanged')!.eventListener({width: 320, height: 40}));
      expect(modifier(anchor().props, 'height')).toEqual({$type: 'height', height: 40});
      expect(rows()[1].props.modifiers).toEqual([{$type: 'fillMaxWidth'}, {$type: 'height', height: 40}]);
      const value = host(p => p.text === 'Medium' && p.color != null);
      expect(value.props.color).toBe(palette.onSurfaceVariant);
      expect(modifier(pill().props, 'clip')).toEqual({$type: 'clip', shape: {type: 'roundedCorner', radius: 8}});
      expect(modifier(pill().props, 'background')?.color).toBe(palette.surfaceContainerHighest);
      expect(modifier(pill().props, 'clickable')).toBeUndefined();
      expect(modifier(pill().props, 'padding')).toEqual({$type: 'padding', start: 12, top: 6, end: 12, bottom: 6});
      expect(host(p => p.tint != null && p.size === 16).props.tint).toBe(palette.onSurfaceVariant);
      for (const label of ['Small', 'Medium', 'Large']) expect(menuItem(label).props.enabled).toBe(true);
    }
  });

  it('seeds an uncontrolled picker with the first item', async () => {
    await render(<Picker testID="pk">{items}</Picker>, options);
    if (isIOS) {
      expect(screen.getByTestId('pk').props.selection).toBe('s');
    } else {
      expect(host(p => p.text === 'Small' && p.color != null)).toBeTruthy();
    }
  });

  it('keeps numeric values typed', async () => {
    await render(
      <Picker selectedValue={15} testID="pk">
        <Picker.Item label="5 minutes" value={5}/>
        <Picker.Item label="15 minutes" value={15}/>
      </Picker>,
      options,
    );
    if (isIOS) {
      expect(screen.getByTestId('pk').props.selection).toBe(15);
      expect(tags()).toEqual([['5 minutes', 5], ['15 minutes', 15]]);
    } else {
      expect(host(p => p.text === '15 minutes' && p.color != null)).toBeTruthy();
    }
  });

  it('leaves the picker on the host tint by default and applies an explicit accentColor', async () => {
    const {rerender} = await render(
      <AccentProvider seed="#8959EA">
        <Picker selectedValue="m" testID="pk">{items}</Picker>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('pk').props, 'tint')).toBeUndefined();
    } else {
      expect(host(p => p.text === 'Medium' && p.color != null).props.color).toBe(palette.onSurfaceVariant);
    }
    await rerender(<Picker selectedValue="m" accentColor="#FF9500" testID="pk">{items}</Picker>);
    if (isIOS) {
      expect(modifier(screen.getByTestId('pk').props, 'tint')).toEqual({$type: 'tint', tint: {type: 'color', color: '#FF9500'}});
    } else {
      expect(host(p => p.text === 'Medium' && p.color != null).props.color).toBe('#FF9500');
      expect(host(p => p.tint != null && p.size === 16).props.tint).toBe('#FF9500');
    }
  });

  it('disables the control', async () => {
    await render(
      <Picker label="Size" selectedValue="m" accentColor="#FF9500" disabled testID="pk">{items}</Picker>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('pk').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      // Still a drop-down, reported disabled: the anchor keeps its role, the surface is
      // disabled, and the box refuses to open.
      expect(anchor().props).toMatchObject({enabled: false, clickable: true});
      expect(modifier(anchor().props, 'menuAnchor')).toEqual({$type: 'menuAnchor', type: 'primaryNotEditable'});
      expect(dropdown().props.onExpandedChange).toBeUndefined();
      expect(dropdown().props.expanded).toBe(false);
      expect(host(p => p.text === 'Size').props.color).toBe(palette.onSurfaceVariant);
      // A disabled picker ignores the accent and greys the value.
      expect(host(p => p.text === 'Medium' && p.color != null).props.color).toBe(palette.onSurfaceVariant);
    }
  });

  (isIOS ? it : it.skip)('emits an explicit enabled modifier when disabled is false', async () => {
    await render(<Picker selectedValue="m" disabled={false} testID="pk">{items}</Picker>, options);
    expect(modifier(screen.getByTestId('pk').props, 'disabled')).toEqual({$type: 'disabled', disabled: false});
  });

  it('renders without a label', async () => {
    await render(<Picker selectedValue="m" testID="pk">{items}</Picker>, options);
    if (isIOS) {
      expect(screen.getByTestId('pk').props.label).toBeUndefined();
    } else {
      const texts = nodes().filter(n => typeof n.props.text === 'string').map(n => n.props.text);
      expect(texts).toEqual(['Medium', 'Medium', 'Small', 'Medium', 'Large']);
      // With no label the anchor has no name of its own.
      expect(modifier(anchor().props, 'semantics')).toBeUndefined();
    }
  });

  it('reports the selected value and stays controlled', async () => {
    const onValueChange = vi.fn();
    await render(<Picker selectedValue="s" onValueChange={onValueChange} testID="pk">{items}</Picker>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('pk'), 'selectionChange', {nativeEvent: {selection: 'l'}});
      expect(screen.getByTestId('pk').props.selection).toBe('s');
    } else {
      await press();
      expect(dropdown().props.expanded).toBe(true);
      expect(menu().props.expanded).toBe(true);
      await act(async () => {
        menuItem('Large').props.onItemPressed();
      });
      expect(dropdown().props.expanded).toBe(false);
      expect(menu().props.expanded).toBe(false);
      expect(host(p => p.text === 'Small' && p.color != null)).toBeTruthy();
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('l');
  });

  it('updates its own selection when uncontrolled', async () => {
    const onValueChange = vi.fn();
    await render(<Picker onValueChange={onValueChange} testID="pk">{items}</Picker>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('pk'), 'selectionChange', {nativeEvent: {selection: 'm'}});
      expect(screen.getByTestId('pk').props.selection).toBe('m');
    } else {
      await act(async () => {
        menuItem('Medium').props.onItemPressed();
      });
      expect(host(p => p.text === 'Medium' && p.color != null)).toBeTruthy();
    }
    expect(onValueChange).toHaveBeenCalledWith('m');
  });

  (isIOS ? it.skip : it)('collapses the dropdown on dismiss and carries no testID modifier without one', async () => {
    await render(<Picker selectedValue="m">{items}</Picker>, options);
    expect(nodes()[0].props.modifiers).toHaveLength(1);
    expect(modifier(nodes()[0].props, 'testID')).toBeUndefined();
    await press();
    expect(menu().props.expanded).toBe(true);
    const [popup] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(popup, 'dismissRequest');
    expect(menu().props.expanded).toBe(false);
    expect(dropdown().props.expanded).toBe(false);
  });

  (isIOS ? it.skip : it)('leaves the press to the anchor: the surface\'s own click opens nothing', async () => {
    const onValueChange = vi.fn();
    await render(<Picker label="Size" selectedValue="m" onValueChange={onValueChange} testID="pk">{items}</Picker>, options);
    await act(async () => {
      anchor().props.onSurfaceClick();
    });
    expect(dropdown().props.expanded).toBe(false);
    expect(menu().props.expanded).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  (isIOS ? it.skip : it)('closes an open menu when the picker is disabled', async () => {
    const {rerender} = await render(<Picker label="Size" selectedValue="m" testID="pk">{items}</Picker>, options);
    await press();
    expect(menu().props.expanded).toBe(true);
    await rerender(<Picker label="Size" selectedValue="m" disabled testID="pk">{items}</Picker>);
    expect(menu().props.expanded).toBe(false);
    expect(dropdown().props.expanded).toBe(false);
  });
});
