import {StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import {MENU_ROOM} from './shared';
import {Card} from '.';

const TOGGLE = 'ExpoInterfaceToggleButton';

describe('Card (windows)', () => {
  it('hides the off star until the pointer is over the card, and keeps a star that is set', async () => {
    const onValueChange = vi.fn();
    await render(
      <Card favorite={{value: false, onValueChange}} title="Holiday photos" onPress={vi.fn()} testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    expect(island(TOGGLE).props).toMatchObject({hidden: true, value: false, label: 'Favorite', glyph: 'E734', activeGlyph: 'E735'});
    const box = screen.getByTestId('card-badge').parent!;
    await fireEvent(box, 'pointerEnter');
    expect(island(TOGGLE).props.hidden).toBe(false);
    await fireEvent(box, 'pointerLeave');
    expect(island(TOGGLE).props.hidden).toBe(true);
    await render(<Card favorite={{value: true, onValueChange}} testID="set"/>);
    expect(island(TOGGLE).props).toMatchObject({hidden: false, value: true});
  });

  it('draws the menu as a WinUI flyout level with the title, and names itself from the title', async () => {
    await render(
      <Card title="Holiday photos" subtitle="Edited yesterday" menu={[{label: 'Rename'}, {label: 'Delete', role: 'destructive'}]} onPress={vi.fn()} testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    expect(screen.getByTestId('card').props.accessibilityLabel).toBe('Holiday photos, Edited yesterday');
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Rename', 'Delete']);
    expect(StyleSheet.flatten(screen.getByText('Holiday photos').parent!.props.style).paddingRight).toBe(MENU_ROOM);
    await fireEvent(screen.getByText('Holiday photos'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 200, height: 40}}});
    expect(StyleSheet.flatten(screen.getByTestId('card-overlay').props.style)).toMatchObject({height: 40 + 24, justifyContent: 'center'});
  });
});
