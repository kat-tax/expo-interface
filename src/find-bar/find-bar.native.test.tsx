import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, modifier} from 'expo-vitest/native';
import {FindBar} from '.';

const isIOS = Platform.OS === 'ios';

/** Presses one of the kit's buttons through the native view's own event. */
async function press(testID: string) {
  if (isIOS) {
    await fireEvent(screen.getByTestId(testID), 'buttonPress');
  } else {
    const [button] = screen.container.queryAll(i => 'onButtonPressed' in i.props && modifier(i.props, 'testID')?.testID === testID);
    if (typeof button.props.onButtonPressed === 'function') await fireEvent(button, 'buttonPressed');
  }
}

const enabled = (testID: string) => isIOS
  ? modifier(screen.getByTestId(testID).props, 'disabled') === undefined
  : byComposeTestID(testID).props.enabled === true;

describe(`FindBar (${Platform.OS})`, () => {
  it('is a bar with an inline field that finds as it is typed, and goes to the next match from the search key', async () => {
    const onChangeText = vi.fn();
    const onNext = vi.fn();
    await render(<FindBar onChangeText={onChangeText} onNext={onNext} testID="find"/>);
    const field = screen.getByTestId('find-field');
    expect(field.props.placeholder).toBe('Find');
    expect(field.props.returnKeyType).toBe('search');
    expect(field.props.submitBehavior).toBe('submit');
    expect(field.props.autoCapitalize).toBe('none');
    expect(field.props.autoCorrect).toBe(false);
    await fireEvent.changeText(field, 'teh');
    expect(onChangeText).toHaveBeenCalledWith('teh');
    await fireEvent(field, 'submitEditing', {nativeEvent: {text: 'teh'}});
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('says where the find has got to, and that there is nothing, in a live region', async () => {
    const {rerender} = await render(<FindBar value="teh" matches={{current: 3, total: 12}} testID="find"/>);
    const count = screen.getByTestId('find-count');
    expect(count).toHaveTextContent('3 of 12');
    expect(count.parent!.props.accessibilityLiveRegion).toBe('polite');
    // Fabric flattens a view whose only trait is its live region, and TalkBack would have no view to watch.
    expect(count.parent!.props.collapsable).toBe(false);
    await rerender(<FindBar value="teh" matches={{current: 0, total: 0}} testID="find"/>);
    expect(screen.getByTestId('find-count')).toHaveTextContent('No matches');
    // Nothing before the app has looked, and nothing with no text.
    await rerender(<FindBar value="teh" testID="find"/>);
    expect(screen.queryByTestId('find-count')).toBeNull();
    await rerender(<FindBar value="" matches={{current: 1, total: 4}} testID="find"/>);
    expect(screen.queryByTestId('find-count')).toBeNull();
  });

  it('steps through the matches with previous and next, closes, and waits with nothing to step through', async () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onClose = vi.fn();
    const {rerender} = await render(<FindBar value="teh" matches={{current: 1, total: 2}} onNext={onNext} onPrevious={onPrevious} onClose={onClose} testID="find"/>);
    await press('find-next');
    await press('find-previous');
    await press('find-close');
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    await rerender(<FindBar value="teh" matches={{current: 0, total: 0}} onNext={onNext} onPrevious={onPrevious} onClose={onClose} testID="find"/>);
    expect(enabled('find-next')).toBe(false);
    expect(enabled('find-previous')).toBe(false);
    expect(enabled('find-close')).toBe(true);
  });

  it('goes back on Shift+Enter, closes on Escape, and leaves other keys to the field', async () => {
    const onPrevious = vi.fn();
    const onClose = vi.fn();
    await render(<FindBar onPrevious={onPrevious} onClose={onClose} autoFocus={false} placeholder="Find in document" testID="find"/>);
    const field = screen.getByPlaceholderText('Find in document');
    await fireEvent(field, 'keyPress', {nativeEvent: {key: 'Enter', shiftKey: true}});
    await fireEvent(field, 'keyPress', {nativeEvent: {key: 'Enter'}});
    await fireEvent(field, 'keyPress', {nativeEvent: {key: 'a'}});
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent(field, 'keyPress', {nativeEvent: {key: 'Escape'}});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('works without handlers or a testID', async () => {
    await render(<FindBar value="teh" matches={{current: 1, total: 1}}/>);
    expect(screen.getByText('1 of 1')).toBeOnTheScreen();
    await fireEvent(screen.getByPlaceholderText('Find'), 'submitEditing', {nativeEvent: {text: 'teh'}});
    await fireEvent(screen.getByPlaceholderText('Find'), 'keyPress', {nativeEvent: {key: 'Escape'}});
    await fireEvent(screen.getByPlaceholderText('Find'), 'keyPress', {nativeEvent: {key: 'Enter', shiftKey: true}});
  });
});
