import type {TextFieldCommands} from '../text-field/types';
import {createRef} from 'react';
import {AccessibilityInfo, Platform, StyleSheet, TextInput} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier} from 'expo-vitest/native';
import {hostFit, hosts} from '../__tests__/hosts';
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
    // The keyboard's send key does nothing while busy.
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'draft'}});
    expect(onSend).not.toHaveBeenCalled();
    await rerender(<Composer value="draft" onChangeText={onChangeText} onSend={onSend} testID="c"/>);
    await press('c-send');
    expect(onSend).toHaveBeenCalledWith('draft');
    expect(onChangeText).not.toHaveBeenCalled();
    expect(screen.getByTestId('c-field').props.value).toBe('draft');
  });

  it('keeps the text it holds itself while busy, for the next send', async () => {
    const onSend = vi.fn();
    const {rerender} = await render(<Composer onSend={onSend} onStop={() => {}} testID="c"/>);
    await fireEvent.changeText(screen.getByTestId('c-field'), 'draft');
    await rerender(<Composer onSend={onSend} onStop={() => {}} busy testID="c"/>);
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'draft'}});
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByTestId('c-field').props.value).toBe('draft');
    await rerender(<Composer onSend={onSend} onStop={() => {}} testID="c"/>);
    expect(onSend).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'draft'}});
    expect(onSend).toHaveBeenCalledWith('draft');
    expect(screen.getByTestId('c-field').props.value).toBe('');
  });

  it('waits while busy with nothing to stop, and shows the notice under the capsule', async () => {
    await render(<Composer onSend={() => {}} busy notice="Shift+Enter for a new line" placeholder="Reply" testID="c"/>);
    expect(enabled('c-stop')).toBe(false);
    expect(screen.getByText('Shift+Enter for a new line')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Reply')).toBeOnTheScreen();
    expect(host(p => p.label === 'Stop' || p.text === 'Stop' || p.contentDescription === 'Stop')).toBeTruthy();
  });

  it('has a screen reader read a new notice out, but not the one it mounts with', async () => {
    const announce = vi.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
    try {
      const {rerender} = await render(<Composer onSend={() => {}} notice="Shift+Enter for a new line" testID="c"/>);
      const live = () => screen.container.queryAll(node => node.props.accessibilityLiveRegion === 'polite');
      const notice = (text: string) => screen.getByText(text).parent!;
      if (isIOS) {
        // iOS has no live regions: the composer announces the line itself.
        expect(live()).toHaveLength(0);
      } else {
        expect(notice('Shift+Enter for a new line').props.accessibilityLiveRegion).toBe('polite');
      }
      await rerender(<Composer onSend={() => {}} testID="c"/>);
      // The region stays mounted with nothing in it, so the next notice appears inside it. It is not collapsable,
      // or Fabric flattens a view whose only trait is its live region and TalkBack has nothing to watch.
      if (!isIOS) {
        expect(live()).toHaveLength(1);
        expect(live()[0].props.collapsable).toBe(false);
      }
      await rerender(<Composer onSend={() => {}} notice="Could not send." noticeColor="destructive" testID="c"/>);
      if (!isIOS) expect(notice('Could not send.').props.accessibilityLiveRegion).toBe('polite');
      await rerender(<Composer onSend={() => {}} notice="Could not send." noticeColor="destructive" busy testID="c"/>);
      await rerender(<Composer onSend={() => {}} notice="Ada is typing" testID="c"/>);
      expect(announce.mock.calls).toEqual(isIOS ? [['Could not send.', {queue: true}], ['Ada is typing', {queue: true}]] : []);
    } finally {
      announce.mockRestore();
    }
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
    expect(field.props).toMatchObject({autoCapitalize: 'none', autoCorrect: false, spellCheck: false, keyboardType: 'email-address'});
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

  it('keeps one line centred in the 44 capsule, with the buttons boxed to it on Android', async () => {
    await render(<Composer onSend={() => {}} menu={{label: 'Send to', icon: SEND_TO, items: []}} testID="c"/>);
    const style = StyleSheet.flatten(screen.getByTestId('c-field').props.style);
    // A line of 20 with 8 above and below: 36, the capsule's 44 less its padding.
    expect(style).toMatchObject({lineHeight: 20, paddingVertical: 8});
    const [menuHost, buttonHost] = hosts();
    if (isIOS) {
      expect(style).not.toHaveProperty('includeFontPadding');
      expect(style).not.toHaveProperty('textAlignVertical');
      for (const node of [menuHost, buttonHost]) {
        expect(hostFit(node)).toEqual({vertical: true, horizontal: true});
        expect(StyleSheet.flatten(node.props.style)).toMatchObject({marginBottom: 2});
      }
    } else {
      // The placeholder is laid out without the font's padding, and the text is centred in the field.
      expect(style).toMatchObject({includeFontPadding: false, textAlignVertical: 'center'});
      // Material's icon button carries a 48dp touch target, which a host sized to it would push the capsule out with:
      // each host is a box of the 36 one line leaves, at the bottom of the row.
      for (const node of [menuHost, buttonHost]) {
        expect(hostFit(node)).toEqual({});
        const box = StyleSheet.flatten(node.props.style);
        expect(box).toMatchObject({width: 36, height: 36, flex: 0, alignSelf: 'flex-end'});
        expect(box).not.toHaveProperty('marginBottom');
      }
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

  it('leaves the stop button live while disabled, and hands the field\'s commands to the ref', async () => {
    const ref = createRef<TextFieldCommands>();
    const onStop = vi.fn();
    // The ref reaches the input's own `focus` and `blur`; whether it is focused is the renderer's business.
    const focus = vi.spyOn(TextInput.prototype, 'focus');
    const blur = vi.spyOn(TextInput.prototype, 'blur');
    try {
      await render(<Composer ref={ref} value="ready" onSend={() => {}} onStop={onStop} busy disabled testID="c"/>);
      expect(screen.getByTestId('c-field').props.editable).toBe(false);
      expect(enabled('c-stop')).toBe(true);
      await press('c-stop');
      expect(onStop).toHaveBeenCalledTimes(1);
      ref.current!.focus();
      expect(focus).toHaveBeenCalledTimes(1);
      ref.current!.blur();
      expect(blur).toHaveBeenCalledTimes(1);
    } finally {
      focus.mockRestore();
      blur.mockRestore();
    }
  });
});
