import {render} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
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

  it('reports a close through onDismiss, and an open through nothing', async () => {
    const onDismiss = vi.fn();
    await render(<PopupMenu items={[{label: 'Heading'}]} at={{x: 0, y: 0}} onDismiss={onDismiss}/>);
    await fireIsland(island(FLYOUT), 'openChange', {open: true});
    expect(onDismiss).not.toHaveBeenCalled();
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireIsland(island(FLYOUT), 'select', {index: 4});
  });
});
