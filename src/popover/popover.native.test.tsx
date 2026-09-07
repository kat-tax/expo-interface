import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {PopoverRect} from './types';
import {Popover} from '.';

const style = () => StyleSheet.flatten(screen.getByTestId('lint').props.style);
const bounds = (width: number, height: number) =>
  act(async () => {
    fireEvent(screen.getByTestId('lint-bounds'), 'layout', {nativeEvent: {layout: {width, height}}});
  });
const card = (height: number) =>
  act(async () => {
    fireEvent(screen.getByTestId('lint'), 'layout', {nativeEvent: {layout: {height}}});
  });
const at: PopoverRect = {x: 40, y: 100, width: 60, height: 20};

describe(`Popover (${Platform.OS})`, () => {
  it('shows nothing without a rectangle to point at', async () => {
    await render(<Popover at={null} title="Spelling" testID="lint"/>);
    expect(screen.queryByTestId('lint')).toBeNull();
    expect(screen.getByTestId('lint-bounds')).toBeTruthy();
  });

  it('puts the card under the rectangle with the title, message and content', async () => {
    await render(
      <Popover at={at} title="Spelling" message="“teh” is not a word." testID="lint">
        <Text>Suggestions</Text>
      </Popover>,
    );
    expect(screen.getByText('Spelling')).toBeOnTheScreen();
    expect(screen.getByText('“teh” is not a word.')).toBeOnTheScreen();
    expect(screen.getByText('Suggestions')).toBeOnTheScreen();
    expect(style()).toMatchObject({position: 'absolute', width: 280, left: 40, top: 128});
  });

  it('keeps the card inside its parent, and flips it above a rectangle near the bottom', async () => {
    await render(<Popover at={{x: 300, y: 400}} title="Spelling" testID="lint"/>);
    await bounds(320, 480);
    await card(100);
    // Clamped to the parent's trailing edge, and flipped above the rectangle.
    expect(style()).toMatchObject({left: 32, top: 292});
  });

  it('leaves a card that fits below where it is', async () => {
    await render(<Popover at={at} title="Spelling" testID="lint"/>);
    await bounds(320, 480);
    await card(100);
    expect(style().top).toBe(128);
  });

  it('takes its actions and dismisses with them', async () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    await render(
      <Popover
        at={at}
        title="Spelling"
        actions={[{label: 'Fix', onPress}, {label: 'Ignore', onPress: vi.fn(), role: 'destructive'}]}
        onDismiss={onDismiss}
        testID="lint"
      />,
    );
    const isIOS = Platform.OS === 'ios';
    // iOS names the button; a Compose text button carries its label as a child.
    const [fix] = isIOS
      ? screen.container.queryAll(i => i.props.label === 'Fix')
      : screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
    await fireEvent(fix, isIOS ? 'buttonPress' : 'buttonPressed');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('needs no testID, and ignores a layout that changes nothing', async () => {
    await render(<Popover at={at} title="Spelling"/>);
    expect(screen.queryByTestId('lint-bounds')).toBeNull();
    await render(<Popover at={at} title="Spelling" testID="lint"/>);
    await bounds(320, 480);
    await card(100);
    const before = style();
    await bounds(320, 480);
    await card(100);
    expect(style()).toEqual(before);
  });

  it('takes a width of its own', async () => {
    await render(<Popover at={at} width={200} testID="lint"/>);
    expect(style().width).toBe(200);
  });
});
