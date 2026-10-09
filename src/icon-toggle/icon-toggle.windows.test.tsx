import {StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {icon} from '../icons';
import {colors} from '../theme';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {TONAL_SIZE} from './shared';
import {IconToggle} from '.';

const TOGGLE = 'ExpoInterfaceToggleButton';

/** The style of the view around the island. */
const around = () => StyleSheet.flatten(island(TOGGLE).parent!.props.style);

describe('IconToggle (windows)', () => {
  it('renders a ToggleButton island with the two glyphs', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} activeIcon={icons.starFilled} value={false} onValueChange={vi.fn()} testID="fav"/>);
    expect(island(TOGGLE).props).toMatchObject({value: false, glyph: 'E734', activeGlyph: 'E735', size: 24, label: 'Favourite', disabled: false, testID: 'fav'});
  });

  it('uses the same glyph for both states without an active icon, and passes the colors', async () => {
    await render(<IconToggle label="Pin" icon={icons.star} value color="#FF0000" offColor="#00FF00" size={20} disabled onValueChange={vi.fn()}/>);
    expect(island(TOGGLE).props).toMatchObject({value: true, glyph: 'E734', activeGlyph: 'E734', color: '#FF0000', offColor: '#00FF00', size: 20, disabled: true});
  });

  it('collapses the control while off with offVisibility hidden, and shows it while on', async () => {
    await render(<IconToggle label="Pin" icon={icons.star} value={false} offVisibility="hidden" onValueChange={vi.fn()}/>);
    expect(island(TOGGLE).props.hidden).toBe(true);
    await render(<IconToggle label="Pin" icon={icons.star} value offVisibility="hidden" onValueChange={vi.fn()}/>);
    expect(island(TOGGLE).props.hidden).toBe(false);
  });

  it('reports the new state', async () => {
    const onValueChange = vi.fn();
    await render(<IconToggle label="Pin" icon={icons.star} value={false} onValueChange={onValueChange}/>);
    await fireIsland(island(TOGGLE), 'valueChange', {value: true});
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('renders nothing for an icon with no Fluent glyph', async () => {
    await render(<IconToggle label="Odd" icon={icon('questionmark')} value={false} onValueChange={vi.fn()}/>);
    expect(islands(TOGGLE)).toHaveLength(0);
  });

  it('draws the tonal toggle in a round view in the pill fill, which keeps its box without the fill while hidden', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} variant="tonal" value={false} onValueChange={vi.fn()}/>);
    expect(around()).toMatchObject({
      width: TONAL_SIZE,
      height: TONAL_SIZE,
      borderRadius: TONAL_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.light.pillBackground,
    });
    // The island is centred in the view rather than hugging the start.
    expect(island(TOGGLE).props.style).toBeUndefined();
    await render(<IconToggle label="Favourite" icon={icons.star} variant="tonal" value={false} offVisibility="hidden" onValueChange={vi.fn()}/>);
    expect(island(TOGGLE).props.hidden).toBe(true);
    expect(around()).toMatchObject({width: TONAL_SIZE, backgroundColor: 'transparent'});
  });

  it('keeps the plain toggle bare, hugging the start of its row', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} value={false} onValueChange={vi.fn()}/>);
    expect(StyleSheet.flatten(island(TOGGLE).props.style)).toEqual({alignSelf: 'flex-start'});
    // No view of the kit's around it: the island sits in the test's root.
    expect(around()).toBeUndefined();
  });
});
