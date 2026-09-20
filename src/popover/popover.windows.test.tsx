import {fireEvent, render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {fireIsland, island, islands} from '../__tests__/windows';
import {Popover} from '.';

const TIP = 'ExpoInterfaceTeachingTip';
const BUTTON = 'ExpoInterfaceButton';

describe('Popover (windows)', () => {
  it('renders nothing but the bounds while there is no rectangle', async () => {
    await render(<Popover at={null} title="Hint" testID="pop"/>);
    expect(screen.getByTestId('pop-bounds')).toBeOnTheScreen();
    expect(islands(TIP)).toHaveLength(0);
  });

  it('shows a Flyout island laid over the rectangle it points at', async () => {
    await render(
      <Popover
        at={{x: 10, y: 20, width: 100, height: 30}}
        title="Spelling"
        message="Did you mean colour?"
        actions={[{label: 'Replace', onPress: vi.fn()}, {label: 'Ignore', onPress: vi.fn(), role: 'destructive'}]}
        width={320}
        testID="pop"
      />,
    );
    const flyout = island(TIP);
    expect(flyout.props).toMatchObject({open: true, title: 'Spelling', message: 'Did you mean colour?', width: 320, testID: 'pop'});
    expect(flyout.props.style).toEqual([expect.objectContaining({position: 'absolute'}), {left: 10, top: 20, width: 100, height: 30}]);
    expect(JSON.parse(flyout.props.actions)).toEqual([{label: 'Replace', role: 'default'}, {label: 'Ignore', role: 'destructive'}]);
  });

  it('gives a point a size to be placed against, and the default width', async () => {
    await render(<Popover at={{x: 5, y: 6}}/>);
    expect(island(TIP).props.style[1]).toEqual({left: 5, top: 6, width: 1, height: 1});
    expect(JSON.parse(island(TIP).props.actions)).toEqual([]);
    expect(island(TIP).props.width).toBe(280);
    expect(island(TIP).props.title).toBeUndefined();
  });

  it('takes an action then dismisses, and dismisses on a light dismiss', async () => {
    const onReplace = vi.fn();
    const onDismiss = vi.fn();
    await render(<Popover at={{x: 0, y: 0}} actions={[{label: 'Replace', onPress: onReplace}]} onDismiss={onDismiss}/>);
    await fireIsland(island(TIP), 'action', {index: 0});
    expect(onReplace).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireIsland(island(TIP), 'action', {index: 3});
    expect(onDismiss).toHaveBeenCalledTimes(2);
    await fireIsland(island(TIP), 'openChange', {open: true});
    expect(onDismiss).toHaveBeenCalledTimes(2);
    await fireIsland(island(TIP), 'openChange', {open: false});
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  describe('with children', () => {
    it('draws the card below the rectangle with the content and the actions as buttons', async () => {
      const onReplace = vi.fn();
      const onDismiss = vi.fn();
      await render(
        <Popover
          at={{x: 10, y: 20, height: 30}}
          title="Note"
          message="A note on this block"
          actions={[{label: 'Replace', onPress: onReplace}]}
          onDismiss={onDismiss}
          testID="pop">
          <Text>Extra</Text>
        </Popover>,
      );
      expect(islands(TIP)).toHaveLength(0);
      expect(screen.getByText('Note')).toBeOnTheScreen();
      expect(screen.getByText('A note on this block')).toBeOnTheScreen();
      expect(screen.getByText('Extra')).toBeOnTheScreen();
      // Until the bounds are measured the card sits below the rectangle, unclamped.
      expect(screen.getByTestId('pop')).toHaveStyle({left: 10, top: 58, width: 280});
      await fireEvent(island(BUTTON), 'press');
      expect(onReplace).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('flips above the rectangle when the bottom is too close, and stays inside the width', async () => {
      await render(
        <Popover at={{x: 500, y: 300, height: 20}} width={200} testID="pop">
          <Text>Extra</Text>
        </Popover>,
      );
      await fireEvent(screen.getByTestId('pop-bounds'), 'layout', {nativeEvent: {layout: {width: 600, height: 400}}});
      await fireEvent(screen.getByTestId('pop'), 'layout', {nativeEvent: {layout: {height: 100}}});
      // 300 + 20 + 8 + 100 + 8 > 400: above, at 300 - 100 - 8; the width clamps to 600 - 200 - 8.
      expect(screen.getByTestId('pop')).toHaveStyle({top: 192, left: 392});
      // The same sizes again change nothing.
      await fireEvent(screen.getByTestId('pop-bounds'), 'layout', {nativeEvent: {layout: {width: 600, height: 400}}});
      await fireEvent(screen.getByTestId('pop'), 'layout', {nativeEvent: {layout: {height: 100}}});
      expect(screen.getByTestId('pop')).toHaveStyle({top: 192});
    });

    it('draws the content alone without a title, message or actions', async () => {
      await render(
        <Popover at={{x: 0, y: 0}} testID="pop">
          <Text>Extra</Text>
        </Popover>,
      );
      expect(screen.getByText('Extra')).toBeOnTheScreen();
      expect(islands(BUTTON)).toHaveLength(0);
    });

    it('draws a title alone, or a message alone', async () => {
      await render(
        <Popover at={{x: 0, y: 0}} title="Only title">
          <Text>Extra</Text>
        </Popover>,
      );
      expect(screen.getByText('Only title')).toBeOnTheScreen();
      await screen.unmount();
      await render(
        <Popover at={{x: 0, y: 0}} message="Only message">
          <Text>Extra</Text>
        </Popover>,
      );
      expect(screen.getByText('Only message')).toBeOnTheScreen();
    });

    it('draws nothing at a null rectangle', async () => {
      await render(
        <Popover at={null} testID="pop">
          <Text>Extra</Text>
        </Popover>,
      );
      expect(screen.queryByText('Extra')).toBeNull();
    });
  });
});

describe('preferredEdge (windows)', () => {
  it('hands the preference to the tip, which places the tail itself', async () => {
    await render(<Popover at={{x: 10, y: 20}} title="Note" preferredEdge="top"/>);
    expect(island(TIP).props.preferredEdge).toBe('top');
    await render(<Popover at={{x: 10, y: 20}} title="Note"/>);
    expect(island(TIP).props.preferredEdge).toBe('auto');
  });

  /** Where the drawn card ended up, once the parent and the card are measured. */
  const cardTop = async (edge: 'auto' | 'top' | 'bottom', at: {x: number; y: number; height: number}) => {
    await render(<Popover at={at} title="Note" preferredEdge={edge} testID="pop"><Text>Extra</Text></Popover>);
    await fireEvent(screen.getByTestId('pop-bounds'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
    await fireEvent(screen.getByTestId('pop'), 'layout', {nativeEvent: {layout: {height: 100}}});
    return StyleSheet.flatten(screen.getByTestId('pop').props.style).top;
  };

  it('places the card the kit draws by the same rule, when there are children', async () => {
    // A preference honoured, and one that cannot be.
    expect(await cardTop('top', {x: 0, y: 300, height: 20})).toBe(192);
    expect(await cardTop('top', {x: 0, y: 10, height: 20})).toBe(38);
    expect(await cardTop('bottom', {x: 0, y: 300, height: 20})).toBe(328);
    expect(await cardTop('bottom', {x: 0, y: 750, height: 20})).toBe(642);
    expect(await cardTop('auto', {x: 0, y: 300, height: 20})).toBe(328);
  });
});
