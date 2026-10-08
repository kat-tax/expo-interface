import type {View} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react';
import {createRef} from 'react';
import {Surface} from '.';

describe('Surface (web)', () => {
  it('paints the palette variables onto a real box', () => {
    render(<Surface raised border="all" padding={12} testID="surface"/>);
    const style = getComputedStyle(screen.getByTestId('surface'));
    expect(style.backgroundColor).toBe('var(--color-background-element)');
    expect(style.borderColor).toBe('var(--color-separator)');
    expect(style.padding).toBe('12px');
    expect(style.boxShadow).toContain('rgba(0, 0, 0, 0.18)');
  });

  it('draws the hairline in a palette token as its variable, and in any other color as it is', () => {
    render(
      <>
        <Surface border="all" borderColor="opaqueSeparator" testID="token"/>
        <Surface border="all" borderColor="#8959EA" testID="literal"/>
      </>,
    );
    expect(getComputedStyle(screen.getByTestId('token')).borderColor).toBe('var(--color-opaque-separator)');
    expect(getComputedStyle(screen.getByTestId('literal')).borderColor).toBe('rgb(137, 89, 234)');
  });

  it('keeps the context menu of the browser closed over it on request, plain or pressable', () => {
    render(
      <>
        <Surface suppressNativeMenu testID="canvas"/>
        <Surface suppressNativeMenu onPress={() => {}} label="Card" testID="card"/>
        <Surface testID="plain"/>
      </>,
    );
    expect(fireEvent.contextMenu(screen.getByTestId('canvas'))).toBe(false);
    expect(fireEvent.contextMenu(screen.getByTestId('card'))).toBe(false);
    expect(fireEvent.contextMenu(screen.getByTestId('plain'))).toBe(true);
  });

  it('hands its ref the DOM element, plain or pressable, with the browser menu still kept closed', () => {
    const plain = createRef<View>();
    const card = createRef<View>();
    render(
      <>
        <Surface ref={plain} suppressNativeMenu testID="canvas"/>
        <Surface ref={card} suppressNativeMenu onPress={() => {}} label="Card" testID="card"/>
      </>,
    );
    expect(plain.current).toBe(screen.getByTestId('canvas'));
    expect(card.current).toBe(screen.getByTestId('card'));
    expect(fireEvent.contextMenu(screen.getByTestId('canvas'))).toBe(false);
    expect(fireEvent.contextMenu(screen.getByTestId('card'))).toBe(false);
  });

  it('is a button when it presses', () => {
    const onPress = vi.fn();
    render(<Surface onPress={onPress} label="Notes" testID="surface"/>);
    const surface = screen.getByRole('button', {name: 'Notes'});
    surface.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
