import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {HOST, hostFit, hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {Switch} from '.';

const isIOS = Platform.OS === 'ios';
const toggle = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
/** The native nodes under the host the switch mounts for itself. */
const bare = () => nodes().filter(n => n.type !== HOST);
/** The Material switch on Android, which only draws: the control is the cover over it. */
const material = () => nodes().find(n => n.type === 'ViewManagerAdapter_ExpoUI_SwitchView')!;
/** Every text the switch draws, in order. */
const texts = () => nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_TextView');

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
};

/** Inside a host, which carries the palette; outside one the switch mounts a host of its own, with the host's. */
function Material({children}: PropsWithChildren) {
  if (isIOS) return <NativeHostContext.Provider value={true}>{children}</NativeHostContext.Provider>;
  return (
    <NativeHostContext.Provider value={true}>
      <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>
    </NativeHostContext.Provider>
  );
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
      // The control is the cover laid over the row: a box with no children,
      // toggleable with the switch role, named by the label, with the testID.
      expect(toggle('sw').type).toBe('ViewManagerAdapter_ExpoUI_BoxView');
      expect(props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['matchParentSize', 'toggleable', 'semantics', 'testID']);
      expect(modifier(props, 'toggleable')).toMatchObject({value: true, role: 'switch'});
      expect(modifier(props, 'semantics')).toEqual({$type: 'semantics', contentDescription: 'Wi-Fi'});
      expect(props.children).toBeUndefined();
      // The Material switch draws under it and is no control of its own.
      const drawn = material().props;
      expect(drawn.value).toBe(true);
      expect(drawn.enabled).toBe(true);
      expect(drawn.colors).toEqual({checkedTrackColor: '#007AFF', checkedThumbColor: '#FFFFFF'});
      expect(drawn.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['graphicsLayer']);
      expect(modifier(drawn, 'graphicsLayer')).toMatchObject({scaleX: 0.8, scaleY: 0.8, transformOriginX: 1});
      const [box, row] = bare();
      expect(box.props).toMatchObject({contentAlignment: 'centerStart', modifiers: [{$type: 'fillMaxWidth'}]});
      expect(row.props.horizontalArrangement).toBe('spaceBetween');
      expect(row.props.modifiers).toEqual([{$type: 'fillMaxWidth'}]);
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
      expect(material().props.colors.checkedTrackColor).toBe('#8959EA');
    }
    await rerender(<Switch value onValueChange={vi.fn()} accentColor="#FF9500" testID="sw"/>);
    if (isIOS) {
      expect(modifier(toggle('sw').props, 'tint')).toEqual({$type: 'tint', tint: {type: 'color', color: '#FF9500'}});
    } else {
      expect(material().props.colors.checkedTrackColor).toBe('#FF9500');
    }
  });

  it('disables the control', async () => {
    const onValueChange = vi.fn();
    await render(<Switch label="Bluetooth" value={false} onValueChange={onValueChange} disabled testID="sw"/>, options);
    const {props} = toggle('sw');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      // `toggleable` takes no `enabled`, so the cover is a toggleable surface
      // that is not enabled: named, with the state and the testID.
      expect(toggle('sw').type).toBe('ViewManagerAdapter_ExpoUI_SurfaceView');
      expect(props).toMatchObject({checked: false, enabled: false, color: '#00000000'});
      expect(props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['matchParentSize', 'semantics', 'testID']);
      expect(material().props.enabled).toBe(false);
      // `@expo/ui` always wires the change handlers; neither reaches the app.
      await act(async () => {
        props.onCheckedChange({nativeEvent: {value: true}});
        material().props.onCheckedChange({nativeEvent: {value: true}});
      });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(host(p => p.text === 'Bluetooth').props.color).toBe(palette.onSurfaceVariant);
    }
  });

  it('draws a supporting line under the label, as the toggle\'s own subtitle', async () => {
    await render(<Switch label="Notifications" supporting="For every new drop" value onValueChange={vi.fn()} testID="sw"/>, options);
    if (isIOS) {
      // Two texts as the label are SwiftUI's title and subtitle for a toggle.
      const {props} = toggle('sw');
      expect(props.label).toBeUndefined();
      expect(host(p => p.text === 'Notifications')).toBeTruthy();
      expect(host(p => p.text === 'For every new drop')).toBeTruthy();
      await render(<Switch supporting="Alone" value onValueChange={vi.fn()} testID="bare"/>, options);
      expect(host(p => p.text === '')).toBeTruthy();
    } else {
      // Under the cover the supporting text only holds its place, transparent;
      // measured, it is drawn again over the cover, where it is read.
      const column = nodes().find(n => n.type === 'ViewManagerAdapter_ExpoUI_ColumnView')!;
      const title = host(p => p.text === 'Notifications');
      expect(title.props.color).toBe(palette.onSurface);
      expect(texts().map(n => n.props.text)).toEqual(['Notifications', 'For every new drop']);
      const held = texts()[1].props;
      expect(held).toMatchObject({typography: 'bodySmall'});
      expect(held.modifiers).toEqual([{$type: 'alpha', alpha: 0}]);
      await act(async () => modifier(column.props, 'onSizeChanged')!.eventListener({width: 280, height: 40}));
      // Placed only once both the width and the title's height are known.
      expect(texts()).toHaveLength(2);
      await act(async () => modifier(title.props, 'onSizeChanged')!.eventListener({width: 120, height: 24}));
      expect(texts().map(n => n.props.text)).toEqual(['Notifications', 'For every new drop', 'For every new drop']);
      const read = texts()[2];
      expect(read.props).toMatchObject({color: palette.onSurfaceVariant, typography: 'bodySmall'});
      expect(read.props.modifiers).toBeUndefined();
      const placed = nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_ColumnView')[1];
      expect(placed.props.modifiers).toEqual([{$type: 'width', width: 280}]);
      const spacer = nodes().find(n => n.type === 'ViewManagerAdapter_ExpoUI_SpacerView')!;
      expect(spacer.props.modifiers).toEqual([{$type: 'height', height: 24}]);
    }
  });

  it('renders only the toggle without a label or testID', async () => {
    await render(<Switch value={false} onValueChange={vi.fn()}/>, options);
    if (isIOS) {
      expect(bare()).toHaveLength(1);
    } else {
      // The switch and the cover over it, in a box the switch's size.
      const [box, drawn, cover] = bare();
      expect(bare()).toHaveLength(3);
      expect(box.props.modifiers).toBeUndefined();
      expect(drawn.type).toBe('ViewManagerAdapter_ExpoUI_SwitchView');
      expect(cover.props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['matchParentSize', 'toggleable']);
    }
  });

  it('mounts a host of its own outside one: the row\'s width with a label, the switch\'s without', async () => {
    await render(<Switch label="Wi-Fi" value onValueChange={vi.fn()} testID="sw"/>);
    expect(hosts()).toHaveLength(1);
    expect(hostFit(hosts()[0])).toEqual({vertical: true});
    await render(<Switch value onValueChange={vi.fn()} testID="bare"/>);
    expect(hostFit(hosts()[0])).toEqual({vertical: true, horizontal: true});
    await render(<Switch label="Wi-Fi" value onValueChange={vi.fn()} testID="inside"/>, options);
    expect(hosts()).toHaveLength(0);
    expect(toggle('inside')).toBeTruthy();
  });

  it('reports the toggled value', async () => {
    const onValueChange = vi.fn();
    await render(<Switch label="Wi-Fi" value={false} onValueChange={onValueChange} testID="sw"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('sw'), 'isOnChange', {nativeEvent: {isOn: true}});
    } else {
      await act(async () => {
        modifier(toggle('sw').props, 'toggleable')!.eventListener();
      });
    }
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
