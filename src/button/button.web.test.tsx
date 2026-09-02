import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Button} from '.';

describe('Button (web)', () => {
  it('renders a native <button> with the label', () => {
    render(<Button label="Continue"/>);
    const button = screen.getByRole('button', {name: 'Continue'});
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('ui-button', 'ui-button--filled', 'ui-button--medium', 'ui-button--pill');
  });

  it('calls onPress on click and not when disabled', () => {
    const onPress = vi.fn();
    const {rerender} = render(<Button label="Save" onPress={onPress}/>);
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<Button label="Save" onPress={onPress} disabled/>);
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('maps variant, size, shape and role to modifier classes', () => {
    render(<Button label="Delete" variant="text" size="large" shape="circle" role="destructive"/>);
    expect(screen.getByRole('button')).toHaveClass(
      'ui-button--text',
      'ui-button--large',
      'ui-button--circle',
      'ui-button--destructive',
    );
    expect(screen.getByRole('button')).not.toHaveClass('ui-button--pill');
  });

  it('keeps the label as an accessible name in icon-only mode', () => {
    render(<Button label="Share" prefixIcon={{symbol: {ios: 'square.and.arrow.up', web: 'share'}}} hideLabel/>);
    const button = screen.getByRole('button', {name: 'Share'});
    expect(button).toHaveClass('ui-button--icon-only');
    expect(button.querySelector('.ui-button__label')).toBeNull();
  });

  it('exposes a custom accent through CSS custom properties', () => {
    render(<Button label="Go" color="#FF00AA"/>);
    const button = screen.getByRole('button');
    expect(button.style.getPropertyValue('--ui-button-accent')).toBe('#FF00AA');
    expect(button.style.getPropertyValue('--ui-button-on-accent')).toBe('#FFFFFF');
  });

  it('wires up the Popover API attributes', () => {
    render(<Button label="Menu" popoverTarget="menu-1" popoverTargetAction="show"/>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('popovertarget', 'menu-1');
    expect(button).toHaveAttribute('popovertargetaction', 'show');
  });

  it('fills the width only on request', () => {
    const {rerender} = render(<Button label="Go"/>);
    expect(screen.getByRole('button')).not.toHaveClass('ui-button--fill');
    rerender(<Button label="Go" fillWidth/>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--fill');
  });

  it('forwards testID as data-testid', () => {
    render(<Button label="x" testID="primary"/>);
    expect(screen.getByTestId('primary')).toBeInTheDocument();
  });

  it('renders leading and trailing symbols, dropping the trailing one in icon-only mode', () => {
    const {rerender} = render(<Button label="Next" prefixIcon={icons.share} suffixIcon={icons.chevron}/>);
    const button = screen.getByRole('button', {name: 'Next'});
    expect(button.childElementCount).toBe(3);
    expect(button.querySelectorAll('.ui-button__label')).toHaveLength(1);

    rerender(<Button label="Next" variant="outlined" suffixIcon={icons.chevron}/>);
    expect(screen.getByRole('button', {name: 'Next'}).childElementCount).toBe(2);

    rerender(<Button label="Next" prefixIcon={icons.share} suffixIcon={icons.chevron} hideLabel/>);
    expect(screen.getByRole('button', {name: 'Next'}).childElementCount).toBe(1);
  });
});
