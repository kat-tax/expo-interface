import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {host, modifier, nodes, type HostNode} from '../__tests__/native';
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

/** The Compose pill row that anchors the dropdown (Android only). */
const pill = () => host(p => modifier(p, 'background') != null);

/** The Compose dropdown menu item whose text slot renders `label` (Android only). */
function menuItem(label: string): HostNode {
  const match = nodes().find(n => 'enabled' in n.props && nodes(n).some(c => c.props.text === label));
  if (!match) throw new Error(`No menu item labelled ${label}`);
  return match;
}

describe(`Picker (${Platform.OS})`, () => {
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
      expect(host(p => p.expanded != null).props.expanded).toBe(false);
      const value = host(p => p.text === 'Medium' && p.color != null);
      expect(value.props.color).toBe(palette.onSurfaceVariant);
      expect(modifier(pill().props, 'clip')).toEqual({$type: 'clip', shape: {type: 'roundedCorner', radius: 8}});
      expect(modifier(pill().props, 'background')?.color).toBe(palette.surfaceContainerHighest);
      expect(modifier(pill().props, 'clickable')).toBeDefined();
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
      expect(modifier(screen.getByTestId('pk').props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
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
      expect(modifier(pill().props, 'clickable')).toBeUndefined();
      expect(host(p => p.text === 'Size').props.color).toBe(palette.onSurfaceVariant);
      // A disabled picker ignores the accent and greys the value.
      expect(host(p => p.text === 'Medium' && p.color != null).props.color).toBe(palette.onSurfaceVariant);
      for (const label of ['Small', 'Medium', 'Large']) {
        expect(menuItem(label).props.onItemPressed).toBeUndefined();
      }
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
      expect(texts).toEqual(['Medium', 'Small', 'Medium', 'Large']);
    }
  });

  it('reports the selected value and stays controlled', async () => {
    const onValueChange = vi.fn();
    await render(<Picker selectedValue="s" onValueChange={onValueChange} testID="pk">{items}</Picker>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('pk'), 'selectionChange', {nativeEvent: {selection: 'l'}});
      expect(screen.getByTestId('pk').props.selection).toBe('s');
    } else {
      await act(async () => {
        modifier(pill().props, 'clickable')?.eventListener();
      });
      expect(host(p => p.expanded != null).props.expanded).toBe(true);
      await act(async () => {
        menuItem('Large').props.onItemPressed();
      });
      expect(host(p => p.expanded != null).props.expanded).toBe(false);
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
});
