import type {MenuItem} from './types';
import type {HostNode} from 'expo-vitest/native';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {HOST, hostFit, hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {Menu} from '.';

vi.mock('./swatch-file', () => ({
  // The dot written for red; nothing for the other colors, as without a file system.
  swatchImage: (hex: string) => (hex === '#FF0000' ? 'file:///cache/expo-interface/swatch-ff0000@3x.png' : undefined),
  forgetSwatches: () => {},
}));

const isIOS = Platform.OS === 'ios';
const trigger = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
/** The menu itself: the first native node under the host it mounts for itself. */
const root = () => nodes().find(n => n.type !== HOST)!;
/** Host nodes for the menu entries: SwiftUI `Button`s / `Divider`s or Compose `DropdownMenuItem`s / dividers. */
const entries = () => isIOS
  ? children(root())
  : children(host(p => p.slotName === 'items'));

const items: MenuItem[] = [
  {label: 'Share', icon: icons.share},
  {label: 'Rename'},
  {label: 'Delete', role: 'destructive', separator: true, icon: icons.trash},
];

describe(`Menu (${Platform.OS})`, () => {
  it('renders the trigger styled like the kit button', async () => {
    await render(<Menu label="Export" items={items} testID="export"/>);
    const {props} = trigger('export');
    if (isIOS) {
      expect(props.label).toBe('Export');
      expect(props.systemImage).toBeUndefined();
      expect(modifier(props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'borderedProminent'});
      expect(modifier(props, 'controlSize')).toEqual({$type: 'controlSize', size: 'regular'});
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', tint: {type: 'color', color: '#007AFF'}});
      expect(modifier(props, 'disabled')).toBeUndefined();
    } else {
      expect(host(p => p.text === 'Export')).toBeTruthy();
      expect(props.enabled).toBe(true);
      expect(root().props.expanded).toBe(false);
    }
  });

  it('mounts a host of its own outside one, and none inside', async () => {
    await render(<Menu label="Export" items={items} testID="export"/>);
    expect(hosts()).toHaveLength(1);
    // Sized to the trigger, as a button in a row of the app's own is.
    expect(hostFit(hosts()[0])).toEqual({vertical: true, horizontal: true});
    await render(
      <NativeHostContext.Provider value={true}>
        <Menu label="Export" items={items} testID="inside"/>
      </NativeHostContext.Provider>,
    );
    expect(hosts()).toHaveLength(0);
    expect(trigger('inside')).toBeTruthy();
  });

  it('maps variant, size, shape and color onto the trigger', async () => {
    await render(<Menu label="Export" items={items} variant="outlined" size="large" shape="rounded" color="#123456" testID="export"/>);
    const {props} = trigger('export');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')?.style).toBe('bordered');
      expect(modifier(props, 'controlSize')?.size).toBe('large');
      expect(modifier(props, 'buttonBorderShape')?.shape).toBe('roundedRectangle');
      expect(modifier(props, 'tint')?.tint.color).toBe('#123456');
    } else {
      expect(props.colors).toEqual({contentColor: '#123456'});
      expect(props.shape).toMatchObject({type: 'roundedCorner'});
      expect(props.contentPadding).toEqual({start: 28, top: 14, end: 28, bottom: 14});
    }
  });

  it('maps the text variant', async () => {
    await render(<Menu label="Export" items={items} variant="text" testID="export"/>);
    const {props} = trigger('export');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')?.style).toBe('plain');
    } else {
      expect(props.colors).toEqual({contentColor: '#007AFF'});
    }
  });

  it('follows the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Menu label="Export" items={items} testID="export"/>
      </AccentProvider>,
    );
    const {props} = trigger('export');
    if (isIOS) {
      expect(modifier(props, 'tint')?.tint.color).toBe('#8959EA');
    } else {
      expect(props.colors).toEqual({containerColor: '#8959EA', contentColor: '#FFFFFF'});
    }
  });

  it('shows the trigger icon and collapses to icon-only', async () => {
    await render(<Menu label="More" icon={icons.settings} items={items} hideLabel testID="more"/>);
    const {props} = trigger('more');
    if (isIOS) {
      expect(props.systemImage).toBe('gearshape');
      expect(modifier(props, 'labelStyle')).toEqual({$type: 'labelStyle', style: 'iconOnly'});
    } else {
      const icon = host(p => p.contentDescription === 'More');
      expect(icon.props.source).toBeDefined();
      expect(nodes().some(n => n.props.text === 'More')).toBe(false);
    }
  });

  it('disables the trigger', async () => {
    await render(<Menu label="Export" items={items} disabled testID="export"/>);
    const {props} = trigger('export');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.enabled).toBe(false);
      expect(screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function')).toHaveLength(0);
    }
  });

  it('renders the entries with icons, roles and a separator', async () => {
    await render(<Menu label="Export" items={items} testID="export"/>);
    const list = entries();
    expect(list).toHaveLength(4);
    const [share, rename, divider, del] = list;
    if (isIOS) {
      expect(share.props).toMatchObject({label: 'Share', systemImage: 'square.and.arrow.up', role: 'default'});
      expect(rename.props).toMatchObject({label: 'Rename', role: 'default'});
      expect(rename.props.systemImage).toBeUndefined();
      expect(divider.props).toEqual({});
      expect(del.props).toMatchObject({label: 'Delete', systemImage: 'trash', role: 'destructive'});
    } else {
      expect(share.props.enabled).toBe(true);
      expect(share.props.elementColors).toEqual({textColor: '#1D1B20FF', leadingIconColor: '#1D1B20FF', trailingIconColor: '#1D1B20FF'});
      expect(children(share).map(c => c.props.slotName)).toEqual(['leadingIcon', 'text']);
      expect(children(rename).map(c => c.props.slotName)).toEqual(['text']);
      expect(divider.props.color).toBe('rgba(60, 60, 67, 0.29)');
      expect(del.props.elementColors).toEqual({textColor: '#FF3B30', leadingIconColor: '#FF3B30', trailingIconColor: '#FF3B30'});
      expect(host(p => p.text === 'Delete').props.color).toBe('#FF3B30');
      expect(host(p => p.slotName === 'leadingIcon', del).children?.[0]).toMatchObject({props: {tint: '#FF3B30', size: 20}});
    }
  });

  it('never draws a separator above the first entry', async () => {
    await render(<Menu label="Export" items={[{label: 'First', separator: true}, {label: 'Second'}]} testID="export"/>);
    const list = entries();
    expect(list).toHaveLength(2);
    if (isIOS) {
      expect(list.map(e => e.props.label)).toEqual(['First', 'Second']);
    } else {
      expect(list.every(e => e.props.enabled === true)).toBe(true);
    }
  });

  it('greys out disabled entries', async () => {
    await render(<Menu label="Export" items={[{label: 'Locked', disabled: true, icon: icons.star}]} testID="export"/>);
    const [locked] = entries();
    if (isIOS) {
      expect(modifier(locked.props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(locked.props.enabled).toBe(false);
      expect(screen.container.queryAll(i => typeof i.props.onItemPressed === 'function')).toHaveLength(0);
      expect(host(p => p.text === 'Locked').props.color).toBe('#49454FFF');
      expect(host(p => p.slotName === 'leadingIcon').children?.[0]).toMatchObject({props: {tint: '#49454FFF'}});
    }
  });

  it('marks the active entry with a check', async () => {
    const onPress = vi.fn();
    await render(<Menu label="Sort" items={[{label: 'Name', active: true, icon: icons.star, onPress}, {label: 'Date'}]} testID="sort"/>);
    const [name, date] = entries();
    if (isIOS) {
      // A checked toggle is how a SwiftUI menu shows the current state.
      expect(name.type).toContain('Toggle');
      expect(name.props).toMatchObject({isOn: true, label: 'Name', systemImage: 'star'});
      expect(date.type).toContain('Button');
      await fireEvent(screen.container.queryAll(i => typeof i.props.onIsOnChange === 'function')[0], 'isOnChange', {nativeEvent: {isOn: false}});
      expect(onPress).toHaveBeenCalledTimes(1);
    } else {
      expect(children(name).map(c => c.props.slotName)).toEqual(['leadingIcon', 'text', 'trailingIcon']);
      expect(host(p => p.text === '✓', name)).toBeTruthy();
      expect(children(date).map(c => c.props.slotName)).toEqual(['text']);
    }
  });

  (isIOS ? it : it.skip)('renders an active entry without an icon, and a disabled one', async () => {
    await render(<Menu label="Sort" items={[{label: 'Name', active: true}, {label: 'Size', active: true, disabled: true}]} testID="sort"/>);
    const [name, size] = entries();
    expect(name.props.systemImage).toBeUndefined();
    expect(name.props.modifiers).toBeUndefined();
    expect(modifier(size.props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
  });

  (isIOS ? it : it.skip)('draws a swatch entry as an image that keeps its color, or a symbol in the color without one', async () => {
    const onRed = vi.fn();
    await render(
      <Menu
        label="Ink"
        items={[
          {label: 'Red', swatch: '#FF0000', active: true, onPress: onRed},
          {label: 'Blue', swatch: '#0000FF', role: 'destructive', disabled: true},
        ]}
        testID="ink"
      />,
    );
    const [red, blue] = entries();
    // A button composed by hand, so the image goes before the label.
    expect(red.props.label).toBeUndefined();
    const file = host(p => typeof p.uiImage === 'string', red);
    expect(file.props.uiImage).toBe('file:///cache/expo-interface/swatch-ff0000@3x.png');
    expect(host(p => p.text === 'Red', red)).toBeTruthy();
    expect(host(p => p.systemName === 'checkmark', red)).toBeTruthy();
    await fireEvent(screen.container.queryAll(i => typeof i.props.onButtonPress === 'function')[0], 'buttonPress');
    expect(onRed).toHaveBeenCalledTimes(1);
    // No file for blue: the symbol in the color, which the menu draws monochrome.
    expect(modifier(host(p => p.systemName === 'circle.fill', blue).props, 'foregroundStyle')?.style.color).toBe('#0000FF');
    expect(blue.props.role).toBe('destructive');
    expect(modifier(blue.props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    expect(nodes(blue).some(n => n.props.systemName === 'checkmark')).toBe(false);
  });

  (isIOS ? it.skip : it)('draws a color dot for a swatch entry', async () => {
    await render(<Menu label="Ink" items={[{label: 'Red', swatch: '#FF0000', icon: icons.star}]} testID="ink"/>);
    const [red] = entries();
    const leading = host(p => p.slotName === 'leadingIcon', red);
    const dot = children(leading)[0];
    expect(dot.type).toContain('Box');
    expect(modifier(dot.props, 'background')).toEqual({$type: 'background', color: '#FF0000'});
    expect(modifier(dot.props, 'size')).toEqual({$type: 'size', width: 16, height: 16});
    expect(nodes(red).some(n => n.type.endsWith('IconView'))).toBe(false);
  });

  it('draws the text variant in the label color with the label tone', async () => {
    await render(<Menu label="More" items={items} variant="text" tone="label" testID="more"/>);
    const {props} = trigger('more');
    if (isIOS) {
      expect(modifier(props, 'tint')?.tint.color).toBe('#000000');
    } else {
      expect(props.colors).toEqual({contentColor: '#000000'});
    }
  });

  it('ignores the label tone for a filled trigger', async () => {
    await render(<Menu label="More" items={items} tone="label" testID="more"/>);
    const {props} = trigger('more');
    if (isIOS) {
      expect(modifier(props, 'tint')?.tint.color).toBe('#007AFF');
    } else {
      expect(props.colors).toEqual({containerColor: '#007AFF', contentColor: '#FFFFFF'});
    }
  });

  it('draws a trigger that is on filled, whatever its variant, and says it is on', async () => {
    await render(<Menu label="Shapes" icon={icons.settings} items={items} variant="text" tone="label" pressed testID="shapes"/>);
    const {props} = trigger('shapes');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')?.style).toBe('borderedProminent');
      // Filled in the accent, not the label color: the label tone is the text variant's.
      expect(modifier(props, 'tint')?.tint.color).toBe('#007AFF');
      // VoiceOver hears the toggle that is on as selected.
      expect(modifier(props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
    } else {
      // Material's toggle button, checked while on, its checked state in the semantics tree.
      expect(props.checked).toBe(true);
      expect(props.colors).toEqual({containerColor: '#00000000', contentColor: '#007AFF', checkedContainerColor: '#007AFF', checkedContentColor: '#FFFFFF'});
    }
  });

  (isIOS ? it : it.skip)('draws the sized icon of a trigger that is on in the color on its fill', async () => {
    const menu = (pressed: boolean) => <Menu label="Shapes" icon={icons.settings} iconSize={22} hideLabel items={items} variant="text" color="#8959EA" pressed={pressed} testID="shapes"/>;
    const {rerender} = await render(menu(true));
    expect(modifier(trigger('shapes').props, 'tint')?.tint.color).toBe('#8959EA');
    expect(modifier(trigger('shapes').props, 'accessibilityLabel')?.label).toBe('Shapes');
    // The symbol stands on the fill, so it takes the color's contrast, as the kit's button's does.
    expect(modifier(host(p => p.systemName === 'gearshape').props, 'foregroundStyle')?.style.color).toBe('#FFFFFF');
    await rerender(menu(false));
    expect(modifier(trigger('shapes').props, 'buttonStyle')?.style).toBe('plain');
    expect(modifier(host(p => p.systemName === 'gearshape').props, 'foregroundStyle')?.style.color).toBe('#8959EA');
  });

  (isIOS ? it.skip : it)('opens the dropdown from a press on a trigger that is a toggle', async () => {
    await render(<Menu label="Shapes" items={items} pressed testID="shapes"/>);
    await act(async () => {
      byComposeTestID('shapes').props.onCheckedChange({nativeEvent: {checked: false}});
    });
    expect(root().props.expanded).toBe(true);
  });

  (isIOS ? it.skip : it)('expands the dropdown when the trigger is pressed', async () => {
    await render(<Menu label="Export" items={items} testID="export"/>);
    const [button] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
    await fireEvent(button, 'buttonPressed');
    expect(root().props.expanded).toBe(true);
  });

  (isIOS ? it.skip : it)('reports the dropdown opening and closing', async () => {
    const onOpenChange = vi.fn();
    await render(<Menu label="Export" items={items} onOpenChange={onOpenChange} testID="export"/>);
    const [button] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
    await fireEvent(button, 'buttonPressed');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  (isIOS ? it.skip : it)('closes the dropdown when an entry is picked or it is dismissed', async () => {
    const onShare = vi.fn();
    const onOpenChange = vi.fn();
    await render(<Menu label="Export" items={[{label: 'Share', onPress: onShare}]} onOpenChange={onOpenChange} testID="export"/>);
    const expanded = () => root().props.expanded;
    const open = async () => {
      const [button] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
      await fireEvent(button, 'buttonPressed');
      expect(expanded()).toBe(true);
    };

    await open();
    const [entry] = screen.container.queryAll(i => typeof i.props.onItemPressed === 'function');
    await fireEvent(entry, 'itemPressed');
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(expanded()).toBe(false);
    // The entry acts first, and the close is reported once it has.
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onShare.mock.invocationCallOrder[0]).toBeLessThan(onOpenChange.mock.invocationCallOrder.at(-1)!);

    await open();
    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(expanded()).toBe(false);
  });
});
