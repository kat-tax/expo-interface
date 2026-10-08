import {StyleSheet} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import * as icons from '../__stories__/icons';
import {NEXT, STOP} from '../glyphs';
import {colors} from '../theme';
import {glyphOf} from '../windows';
import {Composer} from '.';

const BUTTON = 'ExpoInterfaceButton';

describe('Composer (windows)', () => {
  it('sends the trimmed text from the button island and the keyboard, and clears what it keeps itself', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} testID="c"/>);
    const field = screen.getByTestId('c-field');
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({paddingHorizontal: 0, fontSize: 15});
    // react-native-windows submits a multi-line field only on the keys it is given.
    expect(field.props.submitKeyEvents).toEqual([{code: 'Enter'}]);
    expect(island(BUTTON).props).toMatchObject({label: 'Send', disabled: true});
    await fireEvent(screen.getByTestId('c-send'), 'press');
    expect(onSend).not.toHaveBeenCalled();
    await fireEvent.changeText(field, '  hello  ');
    expect(island(BUTTON).props.disabled).toBe(false);
    await fireEvent(screen.getByTestId('c-send'), 'press');
    expect(onSend).toHaveBeenLastCalledWith('hello');
    expect(screen.getByTestId('c-field').props.value).toBe('');
    await fireEvent.changeText(screen.getByTestId('c-field'), 'again');
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'again'}});
    expect(onSend).toHaveBeenLastCalledWith('again');
  });

  it('takes its own labels, icons and keys, colors an error notice, and passes the field its traits', async () => {
    const onKeyPress = vi.fn();
    const props = {
      onSend: () => {},
      onStop: () => {},
      sendLabel: 'Ask',
      stopLabel: 'Cancel',
      sendIcon: NEXT,
      notice: 'Could not send.',
      noticeColor: 'destructive' as const,
      autoCapitalize: 'none' as const,
      autoCorrect: false,
      keyboardType: 'email' as const,
      onKeyPress,
      testID: 'c',
    };
    const {rerender} = await render(<Composer {...props}/>);
    // A token with a Fluent glyph draws icon-only, named by the label.
    expect(island(BUTTON).props).toMatchObject({label: 'Ask', glyph: glyphOf(NEXT), iconOnly: true});
    expect(screen.getByText('Could not send.')).toHaveStyle({color: colors.light.destructive});
    const field = screen.getByTestId('c-field');
    expect(field.props).toMatchObject({autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address'});
    // react-native-windows names Escape by the character it types.
    await fireEvent(field, 'keyPress', {nativeEvent: {key: '\u001b'}});
    expect(onKeyPress).toHaveBeenLastCalledWith('Escape', false);
    await rerender(<Composer {...props} busy/>);
    expect(island(BUTTON).props).toMatchObject({label: 'Cancel', glyph: glyphOf(STOP)});
  });

  it('takes a menu at the leading edge of the capsule', async () => {
    await render(<Composer onSend={() => {}} menu={{label: 'Send to', icon: icons.share, items: [{label: 'Everyone'}]}} testID="c"/>);
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Everyone']);
    expect(island(BUTTON, 0).props.label).toBe('Send to');
  });

  it('is a stop button while busy, waiting with nothing to stop, and shows the notice', async () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const {rerender} = await render(<Composer value="draft" onSend={onSend} onStop={onStop} busy notice="Replying" testID="c"/>);
    expect(island(BUTTON).props).toMatchObject({label: 'Stop', disabled: false});
    await fireEvent(screen.getByTestId('c-stop'), 'press');
    expect(onStop).toHaveBeenCalledTimes(1);
    // Enter waits while busy.
    await fireEvent(screen.getByTestId('c-field'), 'submitEditing', {nativeEvent: {text: 'draft'}});
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('Replying')).toBeOnTheScreen();
    await rerender(<Composer onSend={() => {}} busy testID="c"/>);
    expect(island(BUTTON).props.disabled).toBe(true);
  });
});
