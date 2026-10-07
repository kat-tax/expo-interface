import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Button} from '.';

describe('Button pressed (web)', () => {
  it('is aria-pressed, and drawn filled while on whatever its variant', () => {
    const onPress = vi.fn();
    render(
      <>
        <Button label="Bold" prefixIcon={icons.add} hideLabel variant="text" tone="label" pressed onPress={onPress}/>
        <Button label="Italic" prefixIcon={icons.star} hideLabel variant="text" tone="label" pressed={false}/>
        <Button label="Plain" variant="text"/>
      </>,
    );
    const bold = screen.getByRole('button', {name: 'Bold'});
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(bold).toHaveClass('ui-button--filled');
    // The label tone is the text variant's; a toggle that is on is filled in the accent.
    expect(bold).not.toHaveClass('ui-button--label');
    const italic = screen.getByRole('button', {name: 'Italic'});
    expect(italic).toHaveAttribute('aria-pressed', 'false');
    expect(italic).toHaveClass('ui-button--text', 'ui-button--label');
    expect(screen.getByRole('button', {name: 'Plain'})).not.toHaveAttribute('aria-pressed');
    fireEvent.click(bold);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
