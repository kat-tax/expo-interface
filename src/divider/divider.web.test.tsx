import {render, screen} from '@testing-library/react';
import {Divider} from '.';

describe('Divider (web)', () => {
  it('renders a horizontal <hr> in the theme separator color', () => {
    render(<Divider testID="rule"/>);
    const rule = screen.getByTestId('rule');
    expect(rule.tagName).toBe('HR');
    expect(rule).toHaveAttribute('aria-orientation', 'horizontal');
    expect(rule).toHaveClass('ui-divider');
    expect(rule).not.toHaveClass('ui-divider--vertical');
    expect(rule.style.getPropertyValue('--ui-divider-color')).toBe('');
  });

  it('exposes the rule as a separator', () => {
    render(<Divider/>);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('switches to the vertical modifier and orientation', () => {
    render(<Divider vertical testID="rule"/>);
    const rule = screen.getByTestId('rule');
    expect(rule).toHaveClass('ui-divider', 'ui-divider--vertical');
    expect(rule).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('overrides the color through the custom property', () => {
    render(<Divider color="#FF9500" testID="rule"/>);
    expect(screen.getByTestId('rule').style.getPropertyValue('--ui-divider-color')).toBe('#FF9500');
  });

  it('insets a horizontal rule from the left', () => {
    render(<Divider inset={24} testID="rule"/>);
    expect(screen.getByTestId('rule').style.marginLeft).toBe('24px');
    expect(screen.getByTestId('rule').style.marginTop).toBe('');
  });

  it('insets a vertical rule from the top', () => {
    render(<Divider vertical inset={8} testID="rule"/>);
    expect(screen.getByTestId('rule').style.marginTop).toBe('8px');
    expect(screen.getByTestId('rule').style.marginLeft).toBe('');
  });
});
