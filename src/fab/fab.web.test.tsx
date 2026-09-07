// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {MenuItem} from '../menu/types';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Fab} from '.';

const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

describe('Fab (web)', () => {
  it('renders a circular button named by its label', () => {
    const onPress = vi.fn();
    render(<Fab label="New" icon={icons.add} onPress={onPress} testID="new"/>);
    const button = screen.getByRole('button', {name: 'New'});
    expect(button).toHaveClass('ui-fab', 'ui-fab--regular');
    expect(button).toHaveAttribute('aria-label', 'New');
    expect(button).toHaveAttribute('data-testid', 'new');
    expect(button).not.toHaveAttribute('popovertarget');
    expect(button.textContent).toBe('');
    expect(button.parentElement).toHaveClass('ui-fab__anchor');
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull();
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('maps the sizes and shows the label when extended', () => {
    render(
      <>
        <Fab label="Small" icon={icons.add} size="small"/>
        <Fab label="Large" icon={icons.add} size="large"/>
        <Fab label="New document" icon={icons.add} size="extended"/>
      </>,
    );
    expect(screen.getByRole('button', {name: 'Small'})).toHaveClass('ui-fab--small');
    expect(screen.getByRole('button', {name: 'Large'})).toHaveClass('ui-fab--large');
    const extended = screen.getByRole('button', {name: 'New document'});
    expect(extended).toHaveClass('ui-fab--extended');
    expect(extended).not.toHaveAttribute('aria-label');
    expect(extended.querySelector('.ui-fab__label')).toHaveTextContent('New document');
  });

  it('disables the button', () => {
    const onPress = vi.fn();
    render(<Fab label="New" icon={icons.add} onPress={onPress} disabled/>);
    const button = screen.getByRole('button', {name: 'New'});
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('opens the kit popup menu instead of pressing when given items', () => {
    const onPress = vi.fn();
    const onBlank = vi.fn();
    render(<Fab label="New" icon={icons.add} onPress={onPress} items={[{...items[0], onPress: onBlank}, items[1]]}/>);
    const button = screen.getByRole('button', {name: 'New'});
    const menu = screen.getByRole('menu', {hidden: true});
    expect(button).toHaveAttribute('popovertarget', menu.id);
    expect(menu).toHaveClass('ui-menu__list', 'ui-menu__list--anchored');
    expect(menu.parentElement?.style.getPropertyValue('anchor-name')).toBe(`--${menu.id}`);
    expect(screen.getAllByRole('menuitem', {hidden: true}).map(e => e.textContent)).toEqual(['Blank document', 'Import files…']);
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', {name: 'Blank document', hidden: true}));
    expect(onBlank).toHaveBeenCalledTimes(1);
  });
});
