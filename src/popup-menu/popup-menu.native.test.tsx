import type {MenuItem} from '../menu/types';
import {Platform, StyleSheet} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {PopupMenu} from '.';

const isIOS = Platform.OS === 'ios';
const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [
  {label: 'Heading', icon: icons.add},
  {label: 'Bullet list', active: true},
  {label: 'Delete block', role: 'destructive', separator: true, disabled: true},
];
const hostView = () => nodes().find(n => n.type === HOST)!;

describe(`PopupMenu (${Platform.OS})`, () => {
  it('lays a point-sized host over the content at the point', async () => {
    await render(<PopupMenu items={items} at={{x: 120, y: 48}} testID="popup"/>);
    expect(StyleSheet.flatten(hostView().props.style)).toMatchObject({
      position: 'absolute',
      left: 120,
      top: 48,
    });
    expect(hostView().props.pointerEvents).toBe('box-none');
  });

  it('opens with a point and closes without one', async () => {
    const {rerender} = await render(<PopupMenu items={items} at={null} testID="popup"/>);
    const presented = () => isIOS
      ? screen.getByTestId('popup').props.isPresented
      : host(p => typeof p.expanded === 'boolean').props.expanded;
    expect(presented()).toBe(false);
    await rerender(<PopupMenu items={items} at={{x: 10, y: 20}} testID="popup"/>);
    expect(presented()).toBe(true);
    await rerender(<PopupMenu items={items} at={null} testID="popup"/>);
    expect(presented()).toBe(false);
  });

  it('renders the entries and reports the dismissal', async () => {
    const onDismiss = vi.fn();
    await render(<PopupMenu items={items} at={{x: 0, y: 0}} onDismiss={onDismiss} testID="popup"/>);
    for (const label of ['Heading', 'Bullet list', 'Delete block']) {
      expect(host(p => p.text === label || p.label === label)).toBeTruthy();
    }
    if (isIOS) {
      await fireEvent(screen.getByTestId('popup'), 'isPresentedChange', {nativeEvent: {isPresented: false}});
    } else {
      const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await fireEvent(menu, 'dismissRequest');
    }
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('needs no testID', async () => {
    await render(<PopupMenu items={items} at={{x: 0, y: 0}}/>);
    expect(hostView()).toBeTruthy();
    expect(nodes().some(n => n.props.testID != null)).toBe(false);
  });

  it('keeps only the entries matching the filter', async () => {
    await render(<PopupMenu items={items} at={{x: 0, y: 0}} filter="head" testID="popup"/>);
    expect(host(p => p.text === 'Heading' || p.label === 'Heading')).toBeTruthy();
    expect(nodes().some(n => n.props.text === 'Bullet list' || n.props.label === 'Bullet list')).toBe(false);
  });

  (isIOS ? it : it.skip)('draws the popover rows by hand, since a SwiftUI menu opens only from its own button', async () => {
    const onPress = vi.fn();
    await render(
      <PopupMenu
        items={[{label: 'Heading', icon: icons.add, onPress}, ...items.slice(1)]}
        at={{x: 0, y: 0}}
        testID="popup"
      />,
    );
    // The picked entry closes the popover through the caller's `at`.
    const [button] = screen.container.queryAll(i => typeof i.props.onButtonPress === 'function');
    await fireEvent(button, 'buttonPress');
    expect(onPress).toHaveBeenCalledTimes(1);
    // A destructive entry is red and a disabled one dimmed.
    const text = host(p => p.text === 'Delete block');
    expect(modifier(text.props, 'foregroundStyle')?.color).toBe(colors.light.destructive);
    expect(nodes().some(n => modifier(n.props, 'opacity')?.value === 0.4)).toBe(true);
    // The active entry is ticked.
    expect(nodes().some(n => n.props.systemName === 'checkmark')).toBe(true);

    // A disabled entry takes no press.
    const buttons = screen.container.queryAll(i => typeof i.props.onButtonPress === 'function');
    const onDismiss = vi.fn();
    await fireEvent(buttons[buttons.length - 1], 'buttonPress');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  (isIOS ? it : it.skip)('says nothing when the popover reports itself presented', async () => {
    const onDismiss = vi.fn();
    await render(<PopupMenu items={items} at={{x: 0, y: 0}} onDismiss={onDismiss} testID="popup"/>);
    await fireEvent(screen.getByTestId('popup'), 'isPresentedChange', {nativeEvent: {isPresented: true}});
    expect(onDismiss).not.toHaveBeenCalled();
  });

  (isIOS ? it.skip : it)('anchors the Compose dropdown to the point-sized box', async () => {
    await render(<PopupMenu items={items} at={{x: 4, y: 6}} testID="popup"/>);
    expect(modifier(byComposeTestID('popup').props, 'size')).toMatchObject({width: 1, height: 1});
    const menu = host(p => typeof p.expanded === 'boolean');
    expect(modifier(menu.props, 'matchParentSize')).toBeDefined();
  });
});
