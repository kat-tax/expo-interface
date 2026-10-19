import {AccessibilityInfo} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {islands} from 'expo-vitest/windows';
import {FindBar} from '.';

describe('FindBar (windows)', () => {
  it('is the kit\'s drawn bar with an inline field and the field\'s commands as buttons', async () => {
    const onNext = vi.fn();
    const onClose = vi.fn();
    await render(<FindBar value="teh" matches={{current: 1, total: 3}} onNext={onNext} onClose={onClose} testID="find"/>);
    // A field keeps the commands out of the CommandBar.
    expect(islands('ExpoInterfaceCommandBar')).toHaveLength(0);
    expect(screen.getByTestId('find-count')).toHaveTextContent('1 of 3');
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Previous match', 'Next match', 'Close']);
    await fireEvent(screen.getByTestId('find-next'), 'press');
    await fireEvent(screen.getByTestId('find-close'), 'press');
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('find-field').props.returnKeyType).toBe('search');
  });

  it('announces a new count to Narrator, which hears no live region here, but not the one it opens with', async () => {
    const announce = vi.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
    try {
      const {rerender} = await render(<FindBar value="teh" matches={{current: 1, total: 3}} testID="find"/>);
      expect(announce).not.toHaveBeenCalled();
      // react-native-windows raises no event when a live region's text changes, so the count is in none.
      expect(screen.getByTestId('find-count').parent!.props.accessibilityLiveRegion).toBeUndefined();
      await rerender(<FindBar value="teh" matches={{current: 2, total: 3}} testID="find"/>);
      expect(announce.mock.calls).toEqual([['2 of 3', {queue: true}]]);
    } finally {
      announce.mockRestore();
    }
  });
});
