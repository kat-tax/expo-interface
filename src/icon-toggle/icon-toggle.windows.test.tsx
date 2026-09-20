import {render} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {icon} from '../icons';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {IconToggle} from '.';

const TOGGLE = 'ExpoInterfaceToggleButton';

describe('IconToggle (windows)', () => {
  it('renders a ToggleButton island with the two glyphs', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} activeIcon={icons.starFilled} value={false} onValueChange={vi.fn()} testID="fav"/>);
    expect(island(TOGGLE).props).toMatchObject({value: false, glyph: 'E734', activeGlyph: 'E735', size: 24, label: 'Favourite', disabled: false, testID: 'fav'});
  });

  it('uses the same glyph for both states without an active icon, and passes the colors', async () => {
    await render(<IconToggle label="Pin" icon={icons.star} value color="#FF0000" offColor="#00FF00" size={20} disabled onValueChange={vi.fn()}/>);
    expect(island(TOGGLE).props).toMatchObject({value: true, glyph: 'E734', activeGlyph: 'E734', color: '#FF0000', offColor: '#00FF00', size: 20, disabled: true});
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
});
