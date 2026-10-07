import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {colors} from '../theme';
import {Material, materialProps} from '.';

const MATERIAL = 'ExpoInterfaceMaterial';
const PORTAL = 'ExpoInterfacePortal';

describe('Material (windows)', () => {
  it('draws the children on an acrylic island, inside it through a portal, the padding theirs', async () => {
    await render(
      <Material radius={12} edge="all" style={{padding: 8, width: 240}} testID="material">
        <Text>Over</Text>
      </Material>,
    );
    const material = island(MATERIAL);
    expect(material.props.material).toBe('acrylic');
    expect(material.props.theme).toBe('light');
    expect(island(PORTAL).props.slot).toBe(material.props.slot);
    expect(StyleSheet.flatten(screen.getByTestId('material').props.style)).toMatchObject({
      overflow: 'hidden',
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.light.separator,
      width: 240,
    });
    expect(screen.getByTestId('material')).not.toHaveStyle({padding: 8});
    await fireIsland(island(PORTAL), 'ready', {connected: true});
    expect(screen.getByText('Over').parent).toHaveStyle({padding: 8});
  });

  it('picks the acrylic of each thickness, glass the default one', async () => {
    const kinds = ['thin', 'regular', 'thick', 'glass'] as const;
    await render(<>{kinds.map(kind => <Material key={kind} kind={kind}/>)}</>);
    expect(kinds.map((_, index) => island(MATERIAL, index).props.material)).toEqual(['acrylicThin', 'acrylic', 'acrylicBase', 'acrylic']);
  });

  it('leaves the bars to paint themselves', () => {
    expect(materialProps('regular', 'element', 'all')).toEqual({});
  });
});
