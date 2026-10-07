import {render} from '@testing-library/react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {PopupMenu} from '.';

const FLYOUT = 'ExpoInterfaceMenuFlyout';

describe('PopupMenu (windows)', () => {
  it('renders a closed flyout island over the parent while there is no point', async () => {
    await render(<PopupMenu items={[{label: 'Heading'}]} at={null} testID="popup"/>);
    expect(island(FLYOUT).props).toMatchObject({open: false, atPoint: true, x: 0, y: 0, testID: 'popup'});
    expect(island(FLYOUT).props.style).toMatchObject({position: 'absolute', pointerEvents: 'none'});
  });

  it('opens at the point with the entries the filter keeps', async () => {
    const onHeading = vi.fn();
    const onList = vi.fn();
    await render(
      <PopupMenu
        items={[{label: 'Heading', onPress: onHeading}, {label: 'Task list', keywords: ['todo'], onPress: onList}]}
        at={{x: 10, y: 20}}
        filter="todo"
      />,
    );
    const flyout = island(FLYOUT);
    expect(flyout.props).toMatchObject({open: true, x: 10, y: 20});
    expect(JSON.parse(flyout.props.items).map((item: {label: string}) => item.label)).toEqual(['Task list']);
    await fireIsland(flyout, 'select', {index: 0});
    expect(onList).toHaveBeenCalledTimes(1);
    expect(onHeading).not.toHaveBeenCalled();
  });

  it('opens beside a rectangle, under it or over it, and reports a pick as a selection', async () => {
    const onDismiss = vi.fn();
    const onHeading = vi.fn();
    const at = {x: 10, y: 20, width: 80, height: 24};
    const {rerender} = await render(<PopupMenu items={[{label: 'Heading', onPress: onHeading}]} at={at} onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props).toMatchObject({x: 10, y: 44, edge: 'bottom'});
    await rerender(<PopupMenu items={[{label: 'Heading', onPress: onHeading}]} at={at} preferredEdge="top" onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props).toMatchObject({x: 10, y: 20, edge: 'top'});
    await fireIsland(island(FLYOUT), 'openChange', {open: true});
    await fireIsland(island(FLYOUT), 'select', {index: 0});
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onHeading).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('select');
    // The next close without a pick is a dismissal.
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onDismiss).toHaveBeenLastCalledWith('dismiss');
  });

  it('says nothing of a close the app asked for by clearing the point', async () => {
    const onDismiss = vi.fn();
    const {rerender} = await render(<PopupMenu items={[{label: 'Heading'}]} at={{x: 0, y: 0}} onDismiss={onDismiss}/>);
    await rerender(<PopupMenu items={[{label: 'Heading'}]} at={null} onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props.open).toBe(false);
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('reports a close through onDismiss, and an open through nothing', async () => {
    const onDismiss = vi.fn();
    await render(<PopupMenu items={[{label: 'Heading'}]} at={{x: 0, y: 0}} onDismiss={onDismiss}/>);
    await fireIsland(island(FLYOUT), 'openChange', {open: true});
    expect(onDismiss).not.toHaveBeenCalled();
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('dismiss');
    await fireIsland(island(FLYOUT), 'select', {index: 4});
  });
});
