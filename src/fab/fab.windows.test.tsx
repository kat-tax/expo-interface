import {fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {fireIsland, island, islands} from '../__tests__/windows';
import {Fab} from '.';

const FLYOUT = 'ExpoInterfaceMenuFlyout';

describe('Fab (windows)', () => {
  it('draws a rounded square filled with the tint, holding the glyph', async () => {
    const onPress = vi.fn();
    await render(<Fab label="Add" icon={icons.add} onPress={onPress} testID="fab"/>);
    const button = screen.getByTestId('fab');
    expect(button.props.accessibilityLabel).toBe('Add');
    expect(button).toHaveStyle({height: 56, minWidth: 56, borderRadius: 16, backgroundColor: '#007AFF'});
    expect(screen.getByText('')).toBeOnTheScreen();
    expect(screen.queryByText('Add')).toBeNull();
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(islands(FLYOUT)).toHaveLength(0);
  });

  it('draws the extended capsule with its label, and a circle for the circle shape', async () => {
    await render(
      <>
        <Fab label="New drop" icon={icons.add} size="extended" shape="circle" testID="extended"/>
        <Fab label="Small" icon={icons.add} size="small" disabled testID="small"/>
      </>,
    );
    expect(screen.getByText('New drop')).toBeOnTheScreen();
    expect(screen.getByTestId('extended')).toHaveStyle({height: 56, borderRadius: 28, paddingHorizontal: 20});
    expect(screen.getByTestId('small')).toHaveStyle({height: 40, borderRadius: 12, opacity: 0.5});
  });

  it('opens a MenuFlyout with items instead of pressing', async () => {
    const onPress = vi.fn();
    const onOpenChange = vi.fn();
    const onNew = vi.fn();
    await render(<Fab label="Add" icon={icons.add} onPress={onPress} items={[{label: 'New', onPress: onNew}]} onOpenChange={onOpenChange} testID="fab"/>);
    expect(island(FLYOUT).props.open).toBe(false);
    await fireEvent.press(screen.getByTestId('fab'));
    expect(onPress).not.toHaveBeenCalled();
    expect(island(FLYOUT).props.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await fireEvent.press(screen.getByTestId('fab'));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await fireIsland(island(FLYOUT), 'select', {index: 0});
    await fireIsland(island(FLYOUT), 'select', {index: 5});
    expect(onNew).toHaveBeenCalledTimes(1);
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(island(FLYOUT).props.open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

});
