import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {island, islands} from 'expo-vitest/windows';
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

  it('draws the badge in the color it is given, a token resolved for the scheme', async () => {
    await render(<ListItem badge={3} badgeColor="tint" testID="row">Essay</ListItem>);
    const {props} = island('ExpoInterfaceInfoBadge');
    expect(props.color).toBe(`${colors.light.tint}FF`);
    // The island picks the count's black or white for the fill, as the others do.
    expect(props.textColor).toBeUndefined();
  });

  it('hands any badge color to the island as hex, for the island to pick the count color', async () => {
    await render(
      <>
        <ListItem badge={3} badgeColor="#123456" testID="hex">Essay</ListItem>
        <ListItem badge={3} badgeColor="rgb(0, 122, 255)" testID="rgb">Notes</ListItem>
        <ListItem badge badgeColor="pillBackground" testID="translucent">Drafts</ListItem>
      </>,
    );
    const [hex, rgb, translucent] = islands('ExpoInterfaceInfoBadge').map(node => node.props);
    expect(hex).toMatchObject({color: '#123456FF'});
    expect(hex.textColor).toBeUndefined();
    expect(rgb.color).toBe('#007AFFFF');
    // rgba(118, 118, 128, 0.12)
    expect(translucent.color).toBe('#7676801F');
  });

  it('leaves the island its own critical red without a badge color', async () => {
    await render(<ListItem badge={3} testID="row">Essay</ListItem>);
    const {props} = island('ExpoInterfaceInfoBadge');
    expect(props.color).toBeUndefined();
    expect(props.textColor).toBeUndefined();
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
