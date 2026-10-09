// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {ReactElement} from 'react';
import type {MenuItem} from '../menu/types';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Fab} from '.';

const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

/** A `ToggleEvent` for the popover; jsdom has no constructor for it. */
function toggleEvent(newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', {value: newState});
  return event;
}

describe('Fab (web)', () => {
  it('renders a rounded button named by its label', () => {
    const onPress = vi.fn();
    render(<Fab label="New" icon={icons.add} onPress={onPress} testID="new"/>);
    const button = screen.getByRole('button', {name: 'New'});
    expect(button).toHaveClass('ui-fab', 'ui-fab--regular', 'ui-fab--rounded');
    expect(button).toHaveAttribute('aria-label', 'New');
    expect(button).toHaveAttribute('data-testid', 'new');
    expect(button).not.toHaveAttribute('popovertarget');
    // The glyph is the whole button: an icon, and no label beside it.
    expect(button.querySelector('.ui-fab__label')).toBeNull();
    expect(button.querySelector('.ui-symbol')).toHaveTextContent('add');
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
    // The circular shape rounds a square button fully, and an extended one into a capsule.
    render(
      <>
        <Fab label="Round" icon={icons.add} shape="circle"/>
        <Fab label="Capsule" icon={icons.add} size="extended" shape="circle"/>
      </>,
    );
    expect(screen.getByRole('button', {name: 'Round'})).toHaveClass('ui-fab--circle');
    expect(screen.getByRole('button', {name: 'Capsule'})).toHaveClass('ui-fab--extended', 'ui-fab--circle');
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
    expect(screen.getAllByRole('menuitem', {hidden: true})
      .map(e => e.querySelector('.ui-menu__label')?.textContent))
      .toEqual(['Blank document', 'Import files…']);
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', {name: 'Blank document', hidden: true}));
    expect(onBlank).toHaveBeenCalledTimes(1);
  });

  it('closes an open menu on Escape, and the key goes no further', () => {
    // jsdom ships no imperative Popover API: the close is what the stub sees.
    const hidePopover = vi.fn();
    const proto = HTMLElement.prototype as {hidePopover?: () => void};
    proto.hidePopover = hidePopover;
    const heard = vi.fn();
    const listener = (event: KeyboardEvent) => heard(event.key);
    document.addEventListener('keydown', listener, true);
    try {
      render(<Fab label="New" icon={icons.add} items={items}/>);
      const menu = screen.getByRole('menu', {hidden: true});
      // Shown by the button's `popovertarget`, and the browser reports the opening.
      vi.spyOn(menu, 'matches').mockImplementation(selector => selector === ':popover-open');
      fireEvent(menu, toggleEvent('open'));
      fireEvent.keyDown(screen.getByRole('menuitem', {name: 'Blank document', hidden: true}), {key: 'Escape'});
      expect(hidePopover).toHaveBeenCalledTimes(1);
      expect(heard).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', listener, true);
      delete proto.hidePopover;
    }
  });

  it('gives the button its popover target once a static page has hydrated, and not before', async () => {
    // The one function of `react-dom/server` this calls: the repository carries no types for react-dom.
    const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
    const tree = <Fab label="New" icon={icons.add} items={items} testID="new"/>;
    // What a static export writes: a button with no target, so a press before the page runs opens nothing.
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = renderToString(tree);
    expect(screen.getByTestId('new')).not.toHaveAttribute('popovertarget');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const {unmount} = render(tree, {container, hydrate: true});
      expect(errors).not.toHaveBeenCalled();
      expect(screen.getByTestId('new')).toHaveAttribute('popovertarget', container.querySelector('[popover]')!.id);
      unmount();
    } finally {
      errors.mockRestore();
      container.remove();
    }
  });
});
