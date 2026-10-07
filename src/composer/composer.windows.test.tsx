import {StyleSheet} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import * as icons from '../__stories__/icons';
import {Composer} from '.';

const BUTTON = 'ExpoInterfaceButton';

describe('Composer (windows)', () => {
  it('sends the trimmed text from the button island and the keyboard, and clears what it keeps itself', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} testID="c"/>);
    const field = screen.getByTestId('c-field');
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({paddingHorizontal: 0, fontSize: 15});
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

  it('takes a menu at the leading edge of the capsule', async () => {
    await render(<Composer onSend={() => {}} menu={{label: 'Send to', icon: icons.share, items: [{label: 'Everyone'}]}} testID="c"/>);
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Everyone']);
    expect(island(BUTTON, 0).props.label).toBe('Send to');
  });

  it('is a stop button while busy, waiting with nothing to stop, and shows the notice', async () => {
    const onStop = vi.fn();
    const {rerender} = await render(<Composer onSend={() => {}} onStop={onStop} busy notice="Replying" testID="c"/>);
    expect(island(BUTTON).props).toMatchObject({label: 'Stop', disabled: false});
    await fireEvent(screen.getByTestId('c-stop'), 'press');
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Replying')).toBeOnTheScreen();
    await rerender(<Composer onSend={() => {}} busy testID="c"/>);
    expect(island(BUTTON).props.disabled).toBe(true);
  });
});
