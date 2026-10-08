import {Platform, StyleSheet} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import * as icons from '../__stories__/icons';
import {colors} from '../theme';
import {Composer} from '.';

const SEND_TO = icons.share;

const isIOS = Platform.OS === 'ios';

/** Presses one of the kit's buttons through the native view's own event: SwiftUI's `onButtonPress`, Compose's `onButtonPressed`. */
async function press(testID: string) {
  if (isIOS) {
    await fireEvent(screen.getByTestId(testID), 'buttonPress');
  } else {
    // The native view of the button with this testID; a disabled one has no handler, and a press does nothing.
    const [button] = screen.container.queryAll(i => 'onButtonPressed' in i.props && modifier(i.props, 'testID')?.testID === testID);
    if (typeof button.props.onButtonPressed === 'function') await fireEvent(button, 'buttonPressed');
  }
}

const enabled = (testID: string) => isIOS
  ? modifier(screen.getByTestId(testID).props, 'disabled') === undefined
  : byComposeTestID(testID).props.enabled === true;

describe(`Composer (${Platform.OS})`, () => {
  it('sends the trimmed text from the button and the keyboard, and clears what it keeps itself', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} testID="c"/>);
    const field = screen.getByTestId('c-field');
    expect(field.props.returnKeyType).toBe('send');
    expect(field.props.submitBehavior).toBe('submit');
    expect(field.props.multiline).toBe(true);
    // The bare field: no padding of its own, the capsule draws it.
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({paddingHorizontal: 0, fontSize: 15});
    // A focused field draws no ring on the capsule here: that is web's.
    await fireEvent(field, 'focus');
    let capsule = field.parent;
    while (capsule && StyleSheet.flatten(capsule.props.style)?.minHeight !== 44) capsule = capsule.parent;
    expect(StyleSheet.flatten(capsule!.props.style)).not.toHaveProperty('outlineStyle');
    await fireEvent(field, 'blur');
    // The button is in a host of its own, inside the React Native capsule.
    expect(hosts()).toHaveLength(1);
    // Nothing to send yet.
    expect(enabled('c-send')).toBe(false);
    await press('c-send');
    expect(onSend).not.toHaveBeenCalled();
    await fireEvent.changeText(field, '  hello  ');
    expect(enabled('c-send')).toBe(true);
    await press('c-send');
    expect(onSend).toHaveBeenLastCalledWith('hello');
    expect(screen.getByTestId('c-field').props.value).toBe('');
    await fireEvent.changeText(screen.getByTestId('c-field'), 'again');
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'again'}});
    expect(onSend).toHaveBeenLastCalledWith('again');
    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it('is a stop button while busy, and leaves a controlled text to the app', async () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const onChangeText = vi.fn();
    const {rerender} = await render(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} onStop={onStop} busy testID="c"/>);
    expect(screen.queryByTestId('c-send')).toBeNull();
    await press('c-stop');
    expect(onStop).toHaveBeenCalledTimes(1);
    // The keyboard's send key waits while busy.
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'draft'}});
    expect(onSend).not.toHaveBeenCalled();
    await rerender(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} testID="c"/>);
    await press('c-send');
    expect(onSend).toHaveBeenCalledWith('draft');
    expect(onChangeText).not.toHaveBeenCalled();
    expect(screen.getByTestId('c-field').props.value).toBe('draft');
  });

  it('waits while busy with nothing to stop, and shows the notice under the capsule', async () => {
    await render(<Composer onSend={() => {}} busy notice="Shift+Enter for a new line" placeholder="Reply" testID="c"/>);
    expect(enabled('c-stop')).toBe(false);
    expect(screen.getByText('Shift+Enter for a new line')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Reply')).toBeOnTheScreen();
    expect(host(p => p.label === 'Stop' || p.text === 'Stop' || p.contentDescription === 'Stop')).toBeTruthy();
  });

  it('takes its own labels, icons and keys, colors an error notice, and passes the field its traits', async () => {
    const onKeyPress = vi.fn();
    const props = {
      onSend: () => {},
      onStop: () => {},
      sendLabel: 'Ask',
      stopLabel: 'Cancel',
      sendIcon: icons.star,
      stopIcon: icons.trash,
      notice: 'Could not send.',
      noticeColor: 'destructive' as const,
      autoCapitalize: 'none' as const,
      autoCorrect: false,
      keyboardType: 'email' as const,
      onKeyPress,
      testID: 'c',
    };
    const {rerender} = await render(<Composer {...props}/>);
    const field = screen.getByTestId('c-field');
    expect(field.props).toMatchObject({autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address'});
    // `inputmode` is web's.
    expect(field.props.inputMode).toBeUndefined();
    await fireEvent(field, 'keyPress', {nativeEvent: {key: 'Escape'}});
    expect(onKeyPress).toHaveBeenLastCalledWith('Escape', false);
    expect(host(p => p.label === 'Ask' || p.text === 'Ask' || p.contentDescription === 'Ask')).toBeTruthy();
    if (isIOS) expect(screen.getByTestId('c-send').props.systemImage).toBe('star');
    expect(screen.getByText('Could not send.')).toHaveStyle({color: colors.light.destructive});
    await rerender(<Composer {...props} busy/>);
    expect(host(p => p.label === 'Cancel' || p.text === 'Cancel' || p.contentDescription === 'Cancel')).toBeTruthy();
    if (isIOS) expect(screen.getByTestId('c-stop').props.systemImage).toBe('trash');
  });

  it('takes a menu at the leading edge of the capsule, in a second host', async () => {
    const onPick = vi.fn();
    await render(<Composer onSend={() => {}} menu={{label: 'Send to', icon: SEND_TO, items: [{label: 'Everyone', onPress: onPick}]}} testID="c"/>);
    expect(hosts()).toHaveLength(2);
    expect(host(p => p.text === 'Everyone' || p.label === 'Everyone')).toBeTruthy();
    if (isIOS) {
      expect(screen.getByTestId('c-menu').props.label).toBe('Send to');
    } else {
      expect(byComposeTestID('c-menu')).toBeTruthy();
    }
  });

  it('disables writing and sending', async () => {
    const onSend = vi.fn();
    await render(<Composer value="ready" onSend={onSend} disabled testID="c"/>);
    expect(screen.getByTestId('c-field').props.editable).toBe(false);
    expect(enabled('c-send')).toBe(false);
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'ready'}});
    expect(onSend).not.toHaveBeenCalled();
  });
});
