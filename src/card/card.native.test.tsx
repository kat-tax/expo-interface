import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {drawables} from '../__stories__/icons.drawables';
import {registerDrawables} from '../icons';
import {MENU_ROOM} from './shared';
import {Card} from '.';

const isIOS = Platform.OS === 'ios';

describe(`Card (${Platform.OS})`, () => {
  beforeAll(() => {
    // Compose draws the star from the app's registered vector.
    registerDrawables({star: drawables.star, more_horiz: drawables.settings}, {star: drawables.star_fill});
  });

  it('draws the title and subtitle as its footer, names itself from them, and keeps room for the menu', async () => {
    const rename = vi.fn();
    await render(
      <Card title="Holiday photos" subtitle="Edited yesterday" menu={[{label: 'Rename', onPress: rename}]} onPress={vi.fn()} testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    expect(screen.getByText('Holiday photos')).toBeOnTheScreen();
    expect(screen.getByText('Edited yesterday')).toBeOnTheScreen();
    expect(screen.getByTestId('card').props.accessibilityLabel).toBe('Holiday photos, Edited yesterday');
    const titles = screen.getByText('Holiday photos').parent!;
    expect(StyleSheet.flatten(titles.props.style).paddingRight).toBe(MENU_ROOM);
    // The platform's menu, in the overlay slot.
    expect(host(p => p.text === 'Rename' || p.label === 'Rename')).toBeTruthy();
    expect(screen.getByTestId('card-overlay')).toBeOnTheScreen();
    // Once the footer has been laid out, the slot is as tall as the footer
    // and the card's padding around it, so the menu is centred on the title.
    await fireEvent(screen.getByText('Holiday photos'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 200, height: 36}}});
    expect(StyleSheet.flatten(screen.getByTestId('card-overlay').props.style)).toMatchObject({height: 36 + 24, justifyContent: 'center'});
  });

  it('is named by a label over its title, and by its title alone without a subtitle', async () => {
    await render(
      <>
        <Card title="Holiday photos" label="Photos" onPress={vi.fn()} testID="labelled"/>
        <Card title="Holiday photos" onPress={vi.fn()} testID="titled"/>
      </>,
    );
    expect(screen.getByTestId('labelled').props.accessibilityLabel).toBe('Photos');
    expect(screen.getByTestId('titled').props.accessibilityLabel).toBe('Holiday photos');
    // Without a menu the title takes the whole width, and the card is the surface itself.
    expect(StyleSheet.flatten(screen.getAllByText('Holiday photos')[1].parent!.props.style).paddingRight).toBeUndefined();
    expect(screen.queryByTestId('titled-overlay')).toBeNull();
  });

  it('bleeds the media to the edges, clipped by the corners, with the content padded under it', async () => {
    await render(
      <Card media={<Text>Picture</Text>} title="Holiday photos" padding={16} gap={4} testID="card">
        <Text>Body</Text>
      </Card>,
    );
    const card = StyleSheet.flatten(screen.getByTestId('card').props.style);
    expect(card.overflow).toBe('hidden');
    expect(card.padding).toBe(0);
    expect(card.gap).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByText('Body').parent!.props.style)).toMatchObject({padding: 16, gap: 4});
    expect(screen.getByText('Picture')).toBeOnTheScreen();
  });

  it('draws the star in the badge slot, always shown here, and reports the press', async () => {
    const onValueChange = vi.fn();
    await render(
      <Card favorite={{value: false, onValueChange}} title="Holiday photos" testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    expect(screen.getByTestId('card-badge')).toBeOnTheScreen();
    if (isIOS) {
      const star = screen.getByTestId('card-favorite');
      expect(modifier(star.props, 'accessibilityLabel')?.label).toBe('Favorite');
      // Nothing hovers on a phone, so the off star is never hidden.
      expect(modifier(star.props, 'hidden')).toBeUndefined();
      expect(host(p => p.systemName === 'star')).toBeTruthy();
      // The bare star: no container around the symbol.
      expect(nodes().some(n => modifier(n.props, 'background') !== undefined)).toBe(false);
      await fireEvent(star, 'buttonPress');
    } else {
      const star = byComposeTestID('card-favorite');
      expect(star.props.checked).toBe(false);
      // Material's tonal container behind the star, since it is always on the picture here.
      expect(star.type).toContain('FilledIconToggleButton');
      expect(star.props.colors).toHaveProperty('containerColor');
      expect(host(p => p.contentDescription === 'Favorite')).toBeTruthy();
      // The Compose view reports through its own event prop.
      await act(async () => {
        star.props.onCheckedChange({nativeEvent: {checked: true}});
      });
    }
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('needs no testID for its menu and its star', async () => {
    await render(<Card menu={[{label: 'Rename'}]} favorite={{value: true, onValueChange: vi.fn()}}/>);
    expect(host(p => p.text === 'Rename' || p.label === 'Rename')).toBeTruthy();
    expect(screen.queryByTestId('card-favorite')).toBeNull();
    if (isIOS) {
      expect(host(p => p.systemName === 'star.fill').props.testID).toBeUndefined();
    } else {
      expect(nodes().some(n => n.props.contentDescription === 'Favorite')).toBe(true);
    }
  });

  it('fills the star while it is set, under a name of the app\'s own', async () => {
    await render(<Card favorite={{value: true, onValueChange: vi.fn(), label: 'Starred'}} testID="card"/>);
    if (isIOS) {
      expect(host(p => p.systemName === 'star.fill')).toBeTruthy();
      expect(modifier(screen.getByTestId('card-favorite').props, 'accessibilityLabel')?.label).toBe('Starred');
    } else {
      expect(byComposeTestID('card-favorite').props.checked).toBe(true);
      expect(nodes().some(n => n.props.contentDescription === 'Starred')).toBe(true);
    }
  });

  it('stacks the header, body and footer in a bordered surface', async () => {
    await render(
      <Card
        header={<Text>Header</Text>}
        footer={<Text>Footer</Text>}
        testID="card">
        <Text>Body</Text>
      </Card>,
    );
    for (const text of ['Header', 'Body', 'Footer']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    expect(StyleSheet.flatten(screen.getByTestId('card').props.style)).toMatchObject({
      borderTopWidth: StyleSheet.hairlineWidth,
      padding: 12,
      gap: 8,
    });
    // Without an overlay the card is the surface itself: no stacking wrapper.
    expect(screen.queryByTestId('card-overlay')).toBeNull();
  });

  it('presses and long-presses, and names itself', async () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    await render(<Card onPress={onPress} onLongPress={onLongPress} label="Notes" testID="card"/>);
    const card = screen.getByTestId('card');
    expect(card.props.accessibilityLabel).toBe('Notes');
    await fireEvent.press(card);
    fireEvent(card, 'longPress');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('floats the overlay over the trailing edge, outside the card press target', async () => {
    const onStar = vi.fn();
    await render(
      <Card
        onPress={vi.fn()}
        padding={16}
        overlay={<Text onPress={onStar}>Star</Text>}
        footer={<Text>Yesterday</Text>}
        testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    const overlay = screen.getByTestId('card-overlay');
    expect(StyleSheet.flatten(overlay.props.style)).toMatchObject({
      position: 'absolute',
      right: 0,
      bottom: 0,
      padding: 16,
      // In the style, where React Native takes it; the prop is deprecated.
      pointerEvents: 'box-none',
    });
    // Pressing the star does not press the card.
    await fireEvent.press(screen.getByText('Star'));
    expect(onStar).toHaveBeenCalledTimes(1);
  });

  it('floats a badge over the other end, and carries both at once', async () => {
    const onStar = vi.fn();
    const onCard = vi.fn();
    await render(
      <Card
        onPress={onCard}
        padding={16}
        badge={<Text onPress={onStar}>Star</Text>}
        overlay={<Text>More</Text>}
        footer={<Text>Yesterday</Text>}
        testID="card">
        <Text>Preview</Text>
      </Card>,
    );
    // The badge is at the top of the same trailing edge the overlay is at the
    // bottom of, so a card can carry a star over its picture and a menu below.
    expect(StyleSheet.flatten(screen.getByTestId('card-badge').props.style)).toMatchObject({
      position: 'absolute',
      right: 0,
      top: 0,
      padding: 16,
      pointerEvents: 'box-none',
    });
    expect(StyleSheet.flatten(screen.getByTestId('card-overlay').props.style)).toMatchObject({bottom: 0});

    await fireEvent.press(screen.getByText('Star'));
    expect(onStar).toHaveBeenCalledTimes(1);
    expect(onCard).not.toHaveBeenCalled();
  });

  it('carries a badge on its own, with nothing down by the footer', async () => {
    await render(
      <Card badge={<Text>Star</Text>}>
        <Text>Preview</Text>
      </Card>,
    );
    expect(screen.getByText('Star')).toBeOnTheScreen();
    expect(screen.queryByTestId('card-overlay')).toBeNull();
  });

  it('needs no testID for its overlay', async () => {
    await render(<Card overlay={<Text>Star</Text>}><Text>Preview</Text></Card>);
    expect(screen.getByText('Star')).toBeOnTheScreen();
    expect(screen.queryByTestId('card-overlay')).toBeNull();
  });

  it('dims when disabled', async () => {
    const onPress = vi.fn();
    await render(<Card onPress={onPress} disabled testID="card"/>);
    expect(StyleSheet.flatten(screen.getByTestId('card').props.style).opacity).toBe(0.5);
    await fireEvent.press(screen.getByTestId('card'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
