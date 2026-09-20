import {StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import * as icons from '../__stories__/icons';
import {Chip} from '.';

const CHIP = 'ExpoInterfaceChip';
const BUTTON = 'ExpoInterfaceButton';

describe('Chip (windows)', () => {
  it('is a real ToggleButton when it has a state, which is what carries the toggle pattern', async () => {
    await render(<Chip label="Unread" selected onPress={() => {}} testID="c"/>);
    expect(island(CHIP).props).toMatchObject({value: true, label: 'Unread', theme: 'light', testID: 'c'});
    expect(StyleSheet.flatten(island(CHIP).props.style)).toMatchObject({height: 32});
  });

  it('is the kit\'s own pill Button when it has none', async () => {
    await render(<Chip label="Add tag" onPress={() => {}} testID="c"/>);
    expect(island(BUTTON).props).toMatchObject({label: 'Add tag', variant: 'outlined', shape: 'pill', size: 'small'});
    expect(screen.queryByTestId('c')).not.toBeNull();
  });

  it('reports the state the toggle moved to, and the press an action chip made', async () => {
    const onPress = vi.fn();
    await render(<Chip label="Unread" selected onPress={onPress} testID="c"/>);
    await fireIsland(island(CHIP), 'valueChange', {value: false});
    expect(onPress).toHaveBeenLastCalledWith(false);

    await render(<Chip label="Add tag" onPress={onPress} testID="a"/>);
    await fireIsland(island(BUTTON), 'press', {});
    expect(onPress).toHaveBeenLastCalledWith(true);
  });

  it('hands the icon over as a Segoe code point, and can be turned off', async () => {
    await render(<Chip label="Starred" icon={icons.add} selected={false} disabled onPress={() => {}}/>);
    expect(island(CHIP).props).toMatchObject({value: false, disabled: true});
    expect(island(CHIP).props.glyph).toBeTruthy();
  });
});
