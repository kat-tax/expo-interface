import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {fireIsland, island} from '../__tests__/windows';
import {ContextMenu} from '.';

const FLYOUT = 'ExpoInterfaceMenuFlyout';
const items = (onRename = vi.fn()) => [{label: 'Rename', onPress: onRename}, {label: 'Delete', role: 'destructive' as const}];

describe('ContextMenu (windows)', () => {
  it('wraps the content in a pressable with a closed flyout laid over it', async () => {
    const onPress = vi.fn();
    await render(
      <ContextMenu items={items()} onPress={onPress} testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    expect(screen.getByText('Document')).toBeOnTheScreen();
    expect(island(FLYOUT).props).toMatchObject({open: false, atPoint: true, x: 0, y: 0});
    await fireEvent.press(screen.getByTestId('target'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('opens at the pointer on a right click, not on any other button', async () => {
    const onOpenChange = vi.fn();
    await render(
      <ContextMenu items={items()} onOpenChange={onOpenChange} testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    await fireEvent(screen.getByTestId('target'), 'pointerDown', {nativeEvent: {button: 0, offsetX: 5, offsetY: 6}});
    expect(island(FLYOUT).props.open).toBe(false);
    await fireEvent(screen.getByTestId('target'), 'pointerDown', {nativeEvent: {button: 2, offsetX: 40, offsetY: 12}});
    expect(island(FLYOUT).props).toMatchObject({open: true, x: 40, y: 12});
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('opens at the touch point on a long press', async () => {
    await render(
      <ContextMenu items={items()} testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    await fireEvent(screen.getByTestId('target'), 'longPress', {nativeEvent: {locationX: 7, locationY: 8}});
    expect(island(FLYOUT).props).toMatchObject({open: true, x: 7, y: 8});
  });

  it('opens at a point the content reports and closes back through onDismiss', async () => {
    const onDismiss = vi.fn();
    const onOpenChange = vi.fn();
    const onRename = vi.fn();
    const {rerender} = await render(
      <ContextMenu items={items(onRename)} at={{x: 3, y: 4}} onDismiss={onDismiss} onOpenChange={onOpenChange}>
        <Text>Document</Text>
      </ContextMenu>,
    );
    expect(island(FLYOUT).props).toMatchObject({open: true, x: 3, y: 4});
    await fireIsland(island(FLYOUT), 'select', {index: 0});
    expect(onRename).toHaveBeenCalledTimes(1);
    await fireIsland(island(FLYOUT), 'openChange', {open: true});
    expect(onDismiss).not.toHaveBeenCalled();
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(island(FLYOUT).props.open).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    // Clearing the point opens nothing.
    await rerender(
      <ContextMenu items={items(onRename)} at={null} onDismiss={onDismiss} onOpenChange={onOpenChange}>
        <Text>Document</Text>
      </ContextMenu>,
    );
    expect(island(FLYOUT).props.open).toBe(false);
  });

  it('ignores every gesture and point while disabled', async () => {
    await render(
      <ContextMenu items={items()} at={{x: 1, y: 1}} disabled testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    await fireEvent(screen.getByTestId('target'), 'pointerDown', {nativeEvent: {button: 2, offsetX: 1, offsetY: 1}});
    expect(island(FLYOUT).props.open).toBe(false);
    expect(screen.getByTestId('target').props.onLongPress).toBeUndefined();
  });
});

describe('ContextMenu keyboard (windows)', () => {
  it('opens at the centre of the content on the Menu key and on Shift+F10, and on nothing else', async () => {
    await render(
      <ContextMenu items={items()} testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    const target = screen.getByTestId('target');
    await fireEvent(target, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 120, height: 40}}});
    await fireEvent(target, 'keyDown', {nativeEvent: {key: 'F10', shiftKey: false}});
    expect(island(FLYOUT).props.open).toBe(false);
    await fireEvent(target, 'keyDown', {nativeEvent: {key: 'Enter', shiftKey: true}});
    expect(island(FLYOUT).props.open).toBe(false);
    await fireEvent(target, 'keyDown', {nativeEvent: {key: 'ContextMenu', shiftKey: false}});
    expect(island(FLYOUT).props).toMatchObject({open: true, x: 60, y: 20});
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    await fireEvent(target, 'keyDown', {nativeEvent: {key: 'F10', shiftKey: true}});
    expect(island(FLYOUT).props).toMatchObject({open: true, x: 60, y: 20});
  });

  it('ignores the keys while disabled', async () => {
    await render(
      <ContextMenu items={items()} disabled testID="target">
        <Text>Document</Text>
      </ContextMenu>,
    );
    await fireEvent(screen.getByTestId('target'), 'keyDown', {nativeEvent: {key: 'ContextMenu', shiftKey: false}});
    expect(island(FLYOUT).props.open).toBe(false);
  });

  describe('trigger', () => {
    it('opens on the press when asked, at the press, instead of calling onPress', async () => {
      const onPress = vi.fn();
      await render(
        <ContextMenu items={items()} trigger="tap" onPress={onPress} testID="target">
          <Text>Document</Text>
        </ContextMenu>,
      );
      await fireEvent(screen.getByTestId('target'), 'press', {nativeEvent: {locationX: 9, locationY: 11}});
      expect(island(FLYOUT).props).toMatchObject({open: true, x: 9, y: 11});
      // The press is the menu, so there is no gesture left for `onPress`.
      expect(onPress).not.toHaveBeenCalled();
    });

    it('drops the long press, so one intent does not open the menu twice', async () => {
      await render(
        <ContextMenu items={items()} trigger="tap" testID="target">
          <Text>Document</Text>
        </ContextMenu>,
      );
      await fireEvent(screen.getByTestId('target'), 'longPress', {nativeEvent: {locationX: 7, locationY: 8}});
      expect(island(FLYOUT).props.open).toBe(false);
    });

    it('keeps the right click and the Menu key, which Windows and Narrator both reach for', async () => {
      const {rerender} = await render(
        <ContextMenu items={items()} trigger="tap" testID="target">
          <Text>Document</Text>
        </ContextMenu>,
      );
      await fireEvent(screen.getByTestId('target'), 'pointerDown', {nativeEvent: {button: 2, offsetX: 40, offsetY: 12}});
      expect(island(FLYOUT).props).toMatchObject({open: true, x: 40, y: 12});

      await rerender(
        <ContextMenu items={items()} trigger="tap" testID="target">
          <Text>Document</Text>
        </ContextMenu>,
      );
      await fireEvent(screen.getByTestId('target'), 'layout', {nativeEvent: {layout: {width: 120, height: 40}}});
      await fireEvent(screen.getByTestId('target'), 'keyDown', {nativeEvent: {key: 'ContextMenu', shiftKey: false}});
      expect(island(FLYOUT).props).toMatchObject({open: true, x: 60, y: 20});
    });
  });
});
