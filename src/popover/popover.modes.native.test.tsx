import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Popover} from '.';

const style = (testID = 'pop') => StyleSheet.flatten(screen.getByTestId(testID).props.style);
const measure = async (bounds: {width: number; height: number}, card: number) => {
  await fireEvent(screen.getByTestId('pop-bounds'), 'layout', {nativeEvent: {layout: bounds}});
  await fireEvent(screen.getByTestId('pop'), 'layout', {nativeEvent: {layout: {width: 280, height: card}}});
};
const mouse = {nativeEvent: {pointerType: 'mouse'}};
const touch = {nativeEvent: {pointerType: 'touch'}};

describe(`Popover modes (${Platform.OS})`, () => {
  it('takes the presses around a modal card as its backdrop, and says the card is a dialog', async () => {
    const onDismiss = vi.fn();
    await render(
      <Popover at={{x: 40, y: 100}} modal onDismiss={onDismiss} testID="pop">
        <Text>Option</Text>
      </Popover>,
    );
    expect(style('pop-bounds').pointerEvents).toBe('auto');
    const card = screen.getByTestId('pop');
    expect(card.props.accessibilityViewIsModal).toBe(true);
    expect(card.props.role).toBe('dialog');
    // The modal card hides what is around it from VoiceOver, the backdrop included.
    expect(screen.queryByTestId('pop-backdrop')).toBeNull();
    await fireEvent.press(screen.getByTestId('pop-backdrop', {includeHiddenElements: true}));
    expect(onDismiss).toHaveBeenCalledWith('backdrop');
    // VoiceOver's escape gesture dismisses it as Escape does on web.
    await fireEvent(card, 'accessibilityEscape');
    expect(onDismiss).toHaveBeenLastCalledWith('escape');
  });

  it('needs no testID for its backdrop', async () => {
    const onDismiss = vi.fn();
    await render(<Popover at={{x: 40, y: 100}} title="Option" modal onDismiss={onDismiss}/>);
    const backdrop = screen.getByLabelText('Dismiss', {includeHiddenElements: true});
    expect(backdrop.props.testID).toBeUndefined();
    await fireEvent.press(backdrop);
    expect(onDismiss).toHaveBeenCalledWith('backdrop');
  });

  it('keeps the presses for the canvas when it is not modal, and draws no backdrop', async () => {
    await render(<Popover at={{x: 40, y: 100}} title="Note" testID="pop"/>);
    expect(style('pop-bounds').pointerEvents).toBe('box-none');
    expect(screen.queryByTestId('pop-backdrop')).toBeNull();
    expect(screen.getByTestId('pop').props.accessibilityViewIsModal).toBeUndefined();
  });

  it('keeps clear of the insets at the parent\'s edges', async () => {
    await render(<Popover at={{x: 0, y: 380, height: 20}} title="Note" insets={{top: 60, bottom: 50, left: 16, right: 24}} testID="pop"/>);
    await measure({width: 400, height: 500}, 100);
    // Below is 380 + 20 + 8 = 408, and 408 + 100 runs into the bar's 50 at the bottom: above, at 380 - 100 - 8.
    expect(style()).toMatchObject({top: 272, left: 24});
    // A rectangle near the trailing edge: clamped to the width less the right inset.
    await render(<Popover at={{x: 390, y: 70}} title="Note" insets={{top: 60, right: 24}} testID="pop"/>);
    await measure({width: 400, height: 500}, 100);
    expect(style().left).toBe(400 - 24 - 8 - 280);
  });

  it('does not go above the top inset, and puts the card below when there is no room there', async () => {
    await render(<Popover at={{x: 0, y: 100, height: 20}} title="Note" preferredEdge="top" insets={{top: 60}} testID="pop"/>);
    await measure({width: 400, height: 500}, 100);
    // Above would be 100 - 100 - 8 = -8, under the header's 60: below instead.
    expect(style().top).toBe(128);
  });

  describe('hover', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('lingers once the app clears the rectangle, and goes after the grace, reporting the leave', async () => {
      const onDismiss = vi.fn();
      const {rerender} = await render(<Popover at={{x: 10, y: 10}} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
      await rerender(<Popover at={null} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
      // Still drawn on the last rectangle while the pointer crosses over.
      expect(style()).toMatchObject({left: 10, top: 18});
      await act(async () => vi.advanceTimersByTimeAsync(299));
      expect(screen.getByTestId('pop')).toBeTruthy();
      await act(async () => vi.advanceTimersByTimeAsync(1));
      expect(screen.queryByTestId('pop')).toBeNull();
      expect(onDismiss).toHaveBeenCalledWith('leave');
    });

    it('stays while the pointer is over the card, and goes once it has left for the grace', async () => {
      const onDismiss = vi.fn();
      const {rerender} = await render(<Popover at={{x: 10, y: 10}} title="Spelling" trigger="hover" grace={500} onDismiss={onDismiss} testID="pop"/>);
      await rerender(<Popover at={null} title="Spelling" trigger="hover" grace={500} onDismiss={onDismiss} testID="pop"/>);
      await fireEvent(screen.getByTestId('pop'), 'pointerEnter', mouse);
      await act(async () => vi.advanceTimersByTimeAsync(2000));
      expect(screen.getByTestId('pop')).toBeTruthy();
      await fireEvent(screen.getByTestId('pop'), 'pointerLeave', mouse);
      await act(async () => vi.advanceTimersByTimeAsync(499));
      expect(screen.getByTestId('pop')).toBeTruthy();
      await act(async () => vi.advanceTimersByTimeAsync(1));
      expect(screen.queryByTestId('pop')).toBeNull();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('ignores a touch, and follows the app\'s rectangle when it comes back', async () => {
      const onDismiss = vi.fn();
      const {rerender} = await render(<Popover at={{x: 10, y: 10}} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
      await rerender(<Popover at={null} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
      // A finger on the card is not a hover: the linger runs on.
      await fireEvent(screen.getByTestId('pop'), 'pointerEnter', touch);
      await act(async () => vi.advanceTimersByTimeAsync(200));
      // The pointer back over the word: the app sets a rectangle again, and the linger ends.
      await rerender(<Popover at={{x: 60, y: 10}} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
      await fireEvent(screen.getByTestId('pop'), 'pointerLeave', touch);
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(style().left).toBe(60);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('goes at once when the app clears the rectangle of a manual card', async () => {
      const {rerender} = await render(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
      await fireEvent(screen.getByTestId('pop'), 'pointerEnter', mouse);
      await rerender(<Popover at={null} title="Spelling" testID="pop"/>);
      expect(screen.queryByTestId('pop')).toBeNull();
    });
  });
});
