// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import {render, screen} from '@testing-library/react';
import {Badge} from '.';

describe('Badge (web)', () => {
  it('names itself for a screen reader rather than leaving a bare number in the row', () => {
    render(<Badge count={3} testID="unread"/>);
    const badge = screen.getByTestId('unread');
    expect(badge).toHaveAccessibleName('3 new');
    expect(badge).toHaveAttribute('role', 'status');
    // The digits are drawn but hidden from the reader: the name above says it
    // better, and saying both would announce the number twice.
    expect(badge).toHaveTextContent('3');
    expect(badge.querySelector('[aria-hidden="true"]')).toHaveTextContent('3');
  });

  it('takes the caller\'s own wording', () => {
    render(<Badge count={3} label="3 unread messages" testID="unread"/>);
    expect(screen.getByTestId('unread')).toHaveAccessibleName('3 unread messages');
  });

  it('draws a dot with no number in it', () => {
    render(<Badge dot testID="dot"/>);
    const badge = screen.getByTestId('dot');
    expect(badge).toHaveClass('ui-badge--dot');
    expect(badge).toHaveTextContent('');
    expect(badge).toHaveAccessibleName('New');
    expect(badge.style.getPropertyValue('--ui-badge-size')).toBe('8px');
  });

  it('draws nothing for a count of nothing, unless asked', () => {
    const {rerender} = render(<Badge count={0} testID="zero"/>);
    expect(screen.queryByTestId('zero')).toBeNull();
    rerender(<Badge count={0} showZero testID="zero"/>);
    expect(screen.getByTestId('zero')).toHaveTextContent('0');
  });

  it('stops at the cap', () => {
    render(<Badge count={150} testID="many"/>);
    expect(screen.getByTestId('many')).toHaveTextContent('99+');
  });

  it('takes a fill of its own, and contrasts the number against it', () => {
    render(<Badge count={1} color="#FFFFFF" testID="light"/>);
    // White fill, so the number must be black to be readable.
    const light = screen.getByTestId('light');
    expect(light.style.getPropertyValue('--ui-badge-fill')).toBe('#FFFFFF');
    expect(light.style.getPropertyValue('--ui-badge-on-fill')).toBe('#000000');
    render(<Badge count={1} color="#FFFFFF" textColor="#FF0000" testID="told"/>);
    expect(screen.getByTestId('told').style.getPropertyValue('--ui-badge-on-fill')).toBe('#FF0000');
  });

  it('flattens a style into inline CSS, as the other rows do', () => {
    render(<Badge count={1} style={{opacity: 0.5}} testID="styled"/>);
    expect(screen.getByTestId('styled')).toHaveStyle({opacity: 0.5});
  });
});
