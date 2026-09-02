import type {MenuItem} from '../menu/types';
import type {HostNode} from '../__tests__/native';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from '@expo/ui';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {ContextMenu} from '.';


const isIOS = Platform.OS === 'ios';
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
const entries = () => children(host(p => (isIOS ? p.name : p.slotName) === 'items'));

const items: MenuItem[] = [
  {label: 'Share', icon: icons.share},
  {label: 'Delete', role: 'destructive', separator: true, icon: icons.trash},
];

describe(`ContextMenu (${Platform.OS})`, () => {
  it('wraps the content in the native trigger', async () => {
    await render(
      <ContextMenu items={items} testID="row">
        <Text>Holiday photos</Text>
      </ContextMenu>,
    );
    if (isIOS) {
      const menu = screen.getByTestId('row');
      expect(menu.props.modifiers).toBeUndefined();
      const [trigger] = nodes().filter(n => n.props.name === 'trigger');
      expect(host(p => p.text === 'Holiday photos', trigger)).toBeTruthy();
    } else {
      expect(nodes()[0].props.expanded).toBe(false);
      const box = byComposeTestID('row');
      expect(modifier(box.props, 'combinedClickable')).toBeDefined();
      expect(host(p => p.text === 'Holiday photos', box)).toBeTruthy();
    }
  });

  it('renders the entries with icons, roles and a separator', async () => {
    await render(
      <ContextMenu items={items}>
        <Text>Item</Text>
      </ContextMenu>,
    );
    const [share, divider, del] = entries();
    expect(entries()).toHaveLength(3);
    if (isIOS) {
      expect(share.props).toMatchObject({label: 'Share', systemImage: 'square.and.arrow.up', role: 'default'});
      expect(divider.props).toEqual({});
      expect(del.props).toMatchObject({label: 'Delete', systemImage: 'trash', role: 'destructive'});
    } else {
      expect(share.props.elementColors).toEqual({textColor: '#1D1B20FF', leadingIconColor: '#1D1B20FF'});
      expect(children(share).map(c => c.props.slotName)).toEqual(['leadingIcon', 'text']);
      expect(divider.props.color).toBe('rgba(60, 60, 67, 0.29)');
      expect(del.props.elementColors).toEqual({textColor: '#FF3B30', leadingIconColor: '#FF3B30'});
    }
  });

  it('greys out disabled entries', async () => {
    await render(
      <ContextMenu items={[{label: 'Locked', disabled: true}]}>
        <Text>Item</Text>
      </ContextMenu>,
    );
    const [locked] = entries();
    if (isIOS) {
      expect(modifier(locked.props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(locked.props.enabled).toBe(false);
      expect(host(p => p.text === 'Locked').props.color).toBe('#49454FFF');
    }
  });

  it('wires a plain tap to onPress', async () => {
    await render(
      <ContextMenu items={items} onPress={() => {}} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('row').props, 'onTapGesture')).toBeDefined();
    } else {
      expect(modifier(byComposeTestID('row').props, 'combinedClickable')).toBeDefined();
    }
  });

  it('renders the content alone when disabled', async () => {
    await render(
      <ContextMenu items={items} onPress={() => {}} disabled testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    expect(host(p => p.text === 'Item')).toBeTruthy();
    if (isIOS) {
      expect(screen.queryByTestId('row')).toBeNull();
      expect(nodes().some(n => n.props.name === 'items')).toBe(false);
    } else {
      const box = byComposeTestID('row');
      expect(modifier(box.props, 'combinedClickable')).toBeUndefined();
    }
  });

  (isIOS ? it.skip : it)('opens on long-press, taps through to onPress and closes again', async () => {
    const onPress = vi.fn();
    const onShare = vi.fn();
    await render(
      <ContextMenu items={[{label: 'Share', onPress: onShare}]} onPress={onPress} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    const expanded = () => nodes()[0].props.expanded;
    const gesture = (event: 'click' | 'longClick') =>
      act(async () => {
        modifier(byComposeTestID('row').props, 'combinedClickable')?.eventListener({event});
      });

    await gesture('click');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(expanded()).toBe(false);

    await gesture('longClick');
    expect(expanded()).toBe(true);

    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(expanded()).toBe(false);

    await gesture('longClick');
    const [entry] = screen.container.queryAll(i => typeof i.props.onItemPressed === 'function');
    await fireEvent(entry, 'itemPressed');
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(expanded()).toBe(false);
  });
});
