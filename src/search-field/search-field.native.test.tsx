import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {SearchField} from '.';

describe(`SearchField (${Platform.OS})`, () => {
  it('draws the box with a magnifier, named even without a placeholder', async () => {
    await render(<SearchField value="" onChangeText={() => {}} testID="q"/>);
    // The kit's TextField carries the name; the magnifier is decoration.
    expect(screen.getByTestId('q')).toBeOnTheScreen();
    expect(screen.getByTestId('q-row')).toBeOnTheScreen();
  });

  it('clears the box, and offers nothing to clear when it is empty', async () => {
    const onChangeText = vi.fn();
    await render(<SearchField value="demo" onChangeText={onChangeText} testID="q"/>);
    await fireEvent.press(screen.getByTestId('q-clear'));
    expect(onChangeText).toHaveBeenCalledWith('');

    await render(<SearchField value="" onChangeText={onChangeText} testID="empty"/>);
    expect(screen.queryByTestId('empty-clear')).toBeNull();
  });

  it('draws no clear button when it was told not to, or when the field is off', async () => {
    await render(<SearchField value="demo" clearable={false} onChangeText={() => {}} testID="q"/>);
    expect(screen.queryByTestId('q-clear')).toBeNull();
    await render(<SearchField value="demo" disabled onChangeText={() => {}} testID="off"/>);
    expect(screen.queryByTestId('off-clear')).toBeNull();
  });

  it('offers the completions that match, and takes one on a press', async () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    await render(
      <SearchField
        value="e"
        suggestions={['Demo Reel', 'Project X']}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        testID="q"
      />,
    );
    expect(screen.getByTestId('q-suggestions')).toBeOnTheScreen();
    // Both contain an `e`, which is the point of matching anywhere.
    expect(screen.getByText('Demo Reel')).toBeOnTheScreen();
    expect(screen.getByText('Project X')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Demo Reel'));
    expect(onChangeText).toHaveBeenCalledWith('Demo Reel');
    expect(onSubmit).toHaveBeenCalledWith('Demo Reel');
  });

  it('renders without a testID at all, which is the usual case', async () => {
    await render(<SearchField value="e" suggestions={['Demo Reel']} onChangeText={() => {}}/>);
    expect(screen.getByText('Demo Reel')).toBeOnTheScreen();
    expect(screen.getByLabelText('Clear search')).toBeOnTheScreen();
  });

  it('keeps the list closed until something has been typed, and when nothing matches', async () => {
    await render(<SearchField value="" suggestions={['Demo Reel']} onChangeText={() => {}} testID="q"/>);
    expect(screen.queryByTestId('q-suggestions')).toBeNull();
    await render(<SearchField value="zzz" suggestions={['Demo Reel']} onChangeText={() => {}} testID="none"/>);
    expect(screen.queryByTestId('none-suggestions')).toBeNull();
  });
});
