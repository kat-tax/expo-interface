import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {IconToggle} from '.';

describe('IconToggle (web)', () => {
  it('is an aria-pressed button that reports the new state', () => {
    const onValueChange = vi.fn();
    render(
      <IconToggle label="Favourite" icon={icons.star} value={false} onValueChange={onValueChange} testID="star"/>,
    );
    const toggle = screen.getByRole('button', {name: 'Favourite'});
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-testid', 'star');
    fireEvent.click(toggle);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('reports the on state, sizes the icon and disables', () => {
    render(
      <IconToggle
        label="Favourite"
        icon={icons.star}
        activeIcon={icons.add}
        value
        size={18}
        disabled
        onValueChange={vi.fn()}
      />,
    );
    const toggle = screen.getByRole('button', {name: 'Favourite'});
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect((toggle as HTMLButtonElement).disabled).toBe(true);
    expect(toggle.style.getPropertyValue('--ui-icon-toggle-size')).toBe('18px');
  });

  it('keeps the one icon when there is no second', () => {
    render(<IconToggle label="Pin" icon={icons.star} value onValueChange={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Pin'})).toHaveAttribute('aria-pressed', 'true');
  });
});
