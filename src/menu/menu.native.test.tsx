import type {MenuItem} from './types';
import type {HostNode} from '../__tests__/native';
import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {Menu} from '.';


const isIOS = Platform.OS === 'ios';
const trigger = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
/** Host nodes for the menu entries: SwiftUI `Button`s / `Divider`s or Compose `DropdownMenuItem`s / dividers. */
const entries = () => isIOS
  ? children(nodes()[0])
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
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: '#007AFF'});
      expect(modifier(props, 'disabled')).toBeUndefined();
    } else {
      expect(host(p => p.text === 'Export')).toBeTruthy();
      expect(props.enabled).toBe(true);
      expect(nodes()[0].props.expanded).toBe(false);
    }
  });

  it('maps variant, size, shape and color onto the trigger', async () => {
    await render(<Menu label="Export" items={items} variant="outlined" size="large" shape="rounded" color="#123456" testID="export"/>);
    const {props} = trigger('export');
    if (isIOS) {
      expect(modifier(props, 'buttonStyle')?.style).toBe('bordered');
      expect(modifier(props, 'controlSize')?.size).toBe('large');
      expect(modifier(props, 'buttonBorderShape')?.shape).toBe('roundedRectangle');
      expect(modifier(props, 'tint')?.color).toBe('#123456');
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
      expect(modifier(props, 'tint')?.color).toBe('#8959EA');
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
      expect(share.props.elementColors).toEqual({textColor: '#1D1B20FF', leadingIconColor: '#1D1B20FF'});
      expect(children(share).map(c => c.props.slotName)).toEqual(['leadingIcon', 'text']);
      expect(children(rename).map(c => c.props.slotName)).toEqual(['text']);
      expect(divider.props.color).toBe('rgba(60, 60, 67, 0.29)');
      expect(del.props.elementColors).toEqual({textColor: '#FF3B30', leadingIconColor: '#FF3B30'});
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

  (isIOS ? it.skip : it)('expands the dropdown when the trigger is pressed', async () => {
    await render(<Menu label="Export" items={items} testID="export"/>);
    const [button] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
    await fireEvent(button, 'buttonPressed');
    expect(nodes()[0].props.expanded).toBe(true);
  });

  (isIOS ? it.skip : it)('closes the dropdown when an entry is picked or it is dismissed', async () => {
    const onShare = vi.fn();
    await render(<Menu label="Export" items={[{label: 'Share', onPress: onShare}]} testID="export"/>);
    const expanded = () => nodes()[0].props.expanded;
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

    await open();
    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(expanded()).toBe(false);
  });
});
