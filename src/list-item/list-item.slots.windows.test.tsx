import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {island} from 'expo-vitest/windows';
import * as icons from '../__stories__/icons';
import {glyphChar, windowsGlyph} from '../symbol/segoe';
import {colors} from '../theme';
import {ListItem} from '.';

describe('ListItem slots (windows)', () => {
  it('draws an icon at the start as a Segoe glyph in its tone, before the leading content', async () => {
    await render(<ListItem icon={icons.share} iconTone="accent" leading={<Text>L</Text>} testID="row">Share</ListItem>);
    const glyph = screen.getByText(glyphChar(windowsGlyph(icons.share)!));
    expect(glyph).toHaveStyle({fontSize: 24, color: colors.light.tint});
    expect(screen.getByText('L')).toBeOnTheScreen();
  });

  it('draws a value and a badge at the end, and names the row from its slots', async () => {
    await render(
      <ListItem supporting="Edited" value="2 KB" badge={3} trailing={<Text>T</Text>} onPress={() => {}} testID="row">
        Essay
      </ListItem>,
    );
    expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Essay, Edited, 2 KB, 3 new');
    expect(screen.getByText('2 KB')).toBeOnTheScreen();
    expect(island('ExpoInterfaceInfoBadge').props.value).toBe(3);
    expect(screen.getByText('T')).toBeOnTheScreen();
  });

  it('draws the badge in the color it is given', async () => {
    await render(<ListItem badge={3} badgeColor="tint" testID="row">Essay</ListItem>);
    expect(island('ExpoInterfaceInfoBadge').props).toMatchObject({color: colors.light.tint, textColor: '#FFFFFF'});
  });

  it('takes the selected fill and says so, pressable or not', async () => {
    await render(
      <>
        <ListItem selected badge onPress={() => {}} testID="pressable">Current</ListItem>
        <ListItem selected testID="inert">Also</ListItem>
        <ListItem testID="plain">Plain</ListItem>
      </>,
    );
    expect(screen.getByTestId('pressable')).toHaveStyle({backgroundColor: colors.light.backgroundSelected});
    expect(screen.getByTestId('pressable').props.accessibilityState).toEqual({selected: true});
    expect(screen.getByTestId('pressable').props.accessibilityLabel).toBe('Current, new');
    expect(screen.getByTestId('inert').props.accessibilityState).toEqual({selected: true});
    expect(screen.getByTestId('plain').props.accessibilityState).toBeUndefined();
    expect(screen.getByTestId('plain')).not.toHaveStyle({backgroundColor: colors.light.backgroundSelected});
  });
});
