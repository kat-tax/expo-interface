import {render, screen} from '@testing-library/react';
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

  it('is a button when it presses', () => {
    const onPress = vi.fn();
    render(<Surface onPress={onPress} label="Notes" testID="surface"/>);
    const surface = screen.getByRole('button', {name: 'Notes'});
    surface.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
