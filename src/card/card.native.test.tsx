import {Platform, StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {Card} from '.';

describe(`Card (${Platform.OS})`, () => {
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
