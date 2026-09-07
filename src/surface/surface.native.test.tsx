import {Platform, StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {PRESSED_OPACITY, pressFeedback} from './shared';
import {Surface} from '.';

const style = (testID = 'surface') => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe(`Surface (${Platform.OS})`, () => {
  it('paints the element color with rounded corners by default', async () => {
    await render(<Surface testID="surface"><Text>Body</Text></Surface>);
    expect(style()).toMatchObject({
      backgroundColor: colors.light.backgroundElement,
      borderRadius: 12,
    });
    expect(style().borderTopWidth).toBeUndefined();
    expect(style().boxShadow).toBeUndefined();
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('takes each fill from the theme, and none at all', async () => {
    await render(
      <>
        <Surface color="background" testID="a"/>
        <Surface color="selected" testID="b"/>
        <Surface color="none" testID="c"/>
      </>,
    );
    expect(style('a').backgroundColor).toBe(colors.light.background);
    expect(style('b').backgroundColor).toBe(colors.light.backgroundSelected);
    expect(style('c').backgroundColor).toBeUndefined();
  });

  it('draws the hairline all round, on one edge, or dashed in a color of its own', async () => {
    await render(
      <>
        <Surface border="all" testID="all"/>
        <Surface border="top" testID="top"/>
        <Surface border="bottom" testID="bottom"/>
        <Surface border="all" dashed borderColor="#8959EA" testID="dashed"/>
      </>,
    );
    const hairline = StyleSheet.hairlineWidth;
    expect(style('all')).toMatchObject({
      borderTopWidth: hairline,
      borderBottomWidth: hairline,
      borderLeftWidth: hairline,
      borderRightWidth: hairline,
      borderColor: colors.light.separator,
    });
    expect(style('top').borderTopWidth).toBe(hairline);
    expect(style('top').borderBottomWidth).toBeUndefined();
    expect(style('bottom').borderBottomWidth).toBe(hairline);
    expect(style('bottom').borderTopWidth).toBeUndefined();
    expect(style('dashed')).toMatchObject({borderStyle: 'dashed', borderColor: '#8959EA'});
  });

  it('rounds a pill, lifts a raised surface and pads it', async () => {
    await render(<Surface radius="pill" raised padding={16} testID="surface"/>);
    expect(style()).toMatchObject({borderRadius: 999, padding: 16});
    expect(style().boxShadow).toContain('rgba(0, 0, 0, 0.18)');
  });

  it('presses, long-presses and names itself when it is a button', async () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    await render(
      <Surface onPress={onPress} onLongPress={onLongPress} label="Notes" testID="surface">
        <Text>Notes</Text>
      </Surface>,
    );
    const surface = screen.getByTestId('surface');
    expect(surface.props.accessibilityLabel).toBe('Notes');
    await fireEvent.press(surface);
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent(surface, 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
    // Held down, the surface dims; released, it does not.
    expect(pressFeedback({pressed: true})).toEqual({opacity: PRESSED_OPACITY});
    expect(pressFeedback({pressed: false})).toBeNull();
  });

  it('dims a disabled surface and ignores its presses', async () => {
    const onPress = vi.fn();
    await render(<Surface onPress={onPress} disabled testID="surface"/>);
    const surface = screen.getByTestId('surface');
    await fireEvent.press(surface);
    expect(onPress).not.toHaveBeenCalled();
    expect(style().opacity).toBe(0.5);
  });

  it('reports its size and takes a style of its own', async () => {
    const onLayout = vi.fn();
    await render(<Surface onLayout={onLayout} style={{margin: 4}} testID="surface"/>);
    expect(style().margin).toBe(4);
    fireEvent(screen.getByTestId('surface'), 'layout', {nativeEvent: {layout: {width: 10, height: 20}}});
    expect(onLayout).toHaveBeenCalledTimes(1);
  });
});
