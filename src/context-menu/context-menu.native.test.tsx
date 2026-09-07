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
/** The Compose `DropdownMenu` host (Android). */
const dropdown = () => host(p => 'expanded' in p);

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
      const box = byComposeTestID('row');
      expect(modifier(box.props, 'combinedClickable')).toBeDefined();
      expect(host(p => p.text === 'Holiday photos', box)).toBeTruthy();
      // The dropdown is anchored to an invisible box the size of the content.
      const menu = dropdown();
      expect(menu.props.expanded).toBe(false);
      expect(modifier(menu.props, 'matchParentSize')).toBeDefined();
      expect(children(box).some(c => 'expanded' in c.props)).toBe(true);
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
      expect(share.props.elementColors).toEqual({textColor: '#1D1B20FF', leadingIconColor: '#1D1B20FF', trailingIconColor: '#1D1B20FF'});
      expect(children(share).map(c => c.props.slotName)).toEqual(['leadingIcon', 'text']);
      expect(divider.props.color).toBe('rgba(60, 60, 67, 0.29)');
      expect(del.props.elementColors).toEqual({textColor: '#FF3B30', leadingIconColor: '#FF3B30', trailingIconColor: '#FF3B30'});
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
    const onDismiss = vi.fn();
    await render(
      <ContextMenu items={[{label: 'Share', onPress: onShare}]} onPress={onPress} onDismiss={onDismiss} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    const expanded = () => dropdown().props.expanded;
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
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await gesture('longClick');
    const [entry] = screen.container.queryAll(i => typeof i.props.onItemPressed === 'function');
    await fireEvent(entry, 'itemPressed');
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(expanded()).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  (isIOS ? it.skip : it)('reports the popup opening and closing, including from `at`', async () => {
    const onOpenChange = vi.fn();
    const {rerender} = await render(
      <ContextMenu items={items} onOpenChange={onOpenChange} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    // Not reported while it stays closed.
    expect(onOpenChange).not.toHaveBeenCalled();
    await rerender(
      <ContextMenu items={items} at={{x: 8, y: 12}} onOpenChange={onOpenChange} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(menu, 'dismissRequest');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  (isIOS ? it.skip : it)('opens at the point given by `at` and anchors the dropdown there', async () => {
    const onDismiss = vi.fn();
    const {rerender} = await render(
      <ContextMenu items={items} at={{x: 40, y: 60}} onDismiss={onDismiss} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    let menu = dropdown();
    expect(menu.props.expanded).toBe(true);
    expect(modifier(menu.props, 'offset')).toEqual({$type: 'offset', x: 40, y: 60});
    expect(modifier(menu.props, 'size')).toEqual({$type: 'size', width: 0, height: 0});
    expect(modifier(menu.props, 'matchParentSize')).toBeUndefined();

    const [view] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
    await fireEvent(view, 'dismissRequest');
    expect(dropdown().props.expanded).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    // The same point again is not a new request; a new one reopens.
    await rerender(
      <ContextMenu items={items} at={{x: 10, y: 20}} onDismiss={onDismiss} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    menu = dropdown();
    expect(menu.props.expanded).toBe(true);
    expect(modifier(menu.props, 'offset')).toEqual({$type: 'offset', x: 10, y: 20});

    // A long-press afterwards anchors to the content again.
    await act(async () => {
      modifier(byComposeTestID('row').props, 'combinedClickable')?.eventListener({event: 'longClick'});
    });
    expect(modifier(dropdown().props, 'matchParentSize')).toBeDefined();
  });

  (isIOS ? it.skip : it)('ignores `at` while disabled', async () => {
    await render(
      <ContextMenu items={items} at={{x: 40, y: 60}} disabled testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    expect(dropdown().props.expanded).toBe(false);
  });

  (isIOS ? it : it.skip)('ignores `at` on iOS, where the long-press is the only trigger', async () => {
    await render(
      <ContextMenu items={items} at={{x: 40, y: 60}} onDismiss={vi.fn()} testID="row">
        <Text>Item</Text>
      </ContextMenu>,
    );
    expect(screen.getByTestId('row')).toBeTruthy();
    expect(entries()).toHaveLength(3);
  });
});
