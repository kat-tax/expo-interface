// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {MenuItem} from './types';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Menu} from '.';

const items: MenuItem[] = [
  {label: 'Share', icon: icons.share},
  {label: 'Rename'},
  {label: 'Delete', role: 'destructive', separator: true, icon: icons.trash},
];

/** A `ToggleEvent` for the popover; jsdom has no constructor for it. */
function toggleEvent(newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', {value: newState});
  return event;
}

// jsdom 30's UA stylesheet hides closed popovers (`display: none`), so the
// menu and its entries are outside the accessibility tree until the popover
// opens — role queries need `hidden: true` to reach them.
describe('Menu (web)', () => {
  it('renders a trigger button wired to a native popover menu, closed by default', () => {
    render(<Menu label="Export" items={items} testID="export"/>);
    const trigger = screen.getByRole('button', {name: 'Export'});
    const menu = screen.getByRole('menu', {hidden: true});
    expect(menu).not.toBeVisible();
    expect(trigger).toHaveClass('ui-button', 'ui-button--filled');
    expect(trigger).toHaveAttribute('popovertarget', menu.id);
    expect(trigger).toHaveAttribute('data-testid', 'export');
    expect(menu).toHaveAttribute('popover', 'auto');
    expect(menu).toHaveClass('ui-menu__list');
    expect(menu.parentElement).toHaveClass('ui-menu');
    expect(trigger.parentElement).toBe(menu.parentElement);
  });

  it('renders every entry as a menuitem that hides the popover when picked', () => {
    render(<Menu label="Export" items={items}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    const entries = screen.getAllByRole('menuitem', {hidden: true});
    expect(entries.map(e => e.textContent)).toEqual(['Share', 'Rename', 'Delete']);
    for (const entry of entries) {
      expect(entry).toHaveAttribute('type', 'button');
      expect(entry).toHaveAttribute('popovertarget', menu.id);
      expect(entry).toHaveAttribute('popovertargetaction', 'hide');
      expect(entry).toHaveClass('ui-menu__item');
    }
  });

  it('draws a separator above an entry, but never above the first one', () => {
    const {rerender} = render(<Menu label="Export" items={items}/>);
    const separators = screen.getAllByRole('separator', {hidden: true});
    expect(separators).toHaveLength(1);
    expect(separators[0].nextElementSibling).toBe(screen.getByRole('menuitem', {name: 'Delete', hidden: true}));

    rerender(<Menu label="Export" items={[{label: 'First', separator: true}, {label: 'Second'}]}/>);
    expect(screen.queryByRole('separator', {hidden: true})).toBeNull();
  });

  it('styles destructive entries and disables entries', () => {
    render(<Menu label="Export" items={[...items, {label: 'Locked', disabled: true}]}/>);
    expect(screen.getByRole('menuitem', {name: 'Delete', hidden: true})).toHaveClass('ui-menu__item--destructive');
    expect(screen.getByRole('menuitem', {name: 'Share', hidden: true})).not.toHaveClass('ui-menu__item--destructive');
    expect(screen.getByRole('menuitem', {name: 'Locked', hidden: true})).toBeDisabled();
    expect(screen.getByRole('menuitem', {name: 'Share', hidden: true})).toBeEnabled();
  });

  it('renders a leading icon for entries that have one', () => {
    render(<Menu label="Export" items={items}/>);
    const share = screen.getByRole('menuitem', {name: 'Share', hidden: true});
    const rename = screen.getByRole('menuitem', {name: 'Rename', hidden: true});
    expect(share.childElementCount).toBe(2);
    expect(rename.childElementCount).toBe(1);
    expect(share.lastElementChild?.tagName).toBe('SPAN');
  });

  it('calls the entry handler when picked', () => {
    const onPress = vi.fn();
    const onLocked = vi.fn();
    render(
      <Menu
        label="Export"
        items={[
          {label: 'Share', onPress},
          {label: 'Locked', disabled: true, onPress: onLocked},
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('menuitem', {name: 'Share', hidden: true}));
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('menuitem', {name: 'Locked', hidden: true}));
    expect(onLocked).not.toHaveBeenCalled();
  });

  it('forwards the button styling props to the trigger', () => {
    render(
      <Menu label="More" icon={icons.settings} items={items} variant="outlined" size="small" shape="circle" hideLabel disabled/>,
    );
    const trigger = screen.getByRole('button', {name: 'More'});
    expect(trigger).toHaveClass('ui-button--outlined', 'ui-button--small', 'ui-button--circle', 'ui-button--icon-only');
    expect(trigger).toHaveAttribute('aria-label', 'More');
    expect(trigger).toBeDisabled();
  });

  it('passes a custom accent through to the trigger', () => {
    render(<Menu label="Publish" items={items} color="#FF9500"/>);
    expect(screen.getByRole('button', {name: 'Publish'}).style.getPropertyValue('--ui-button-accent')).toBe('#FF9500');
  });

  it('focuses the first enabled entry and anchors the popup when it opens', () => {
    render(<Menu label="Export" items={[{label: 'Locked', disabled: true}, ...items]}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    // jsdom 30 reports CSS anchor positioning via `CSS.supports`, so the popup
    // is placed by CSS against the wrapper's anchor and the measured fallback
    // never runs — opening only moves focus into the menu.
    expect(menu).toHaveClass('ui-menu__list--anchored');
    expect(menu.style.getPropertyValue('position-anchor')).toBe(`--${menu.id}`);
    expect(menu.parentElement?.style.getPropertyValue('anchor-name')).toBe(`--${menu.id}`);
    fireEvent(menu, toggleEvent('open'));
    expect(document.activeElement).toBe(screen.getByRole('menuitem', {name: 'Share', hidden: true}));
    expect(menu.style.left).toBe('');
  });

  it('ignores the close toggle', () => {
    render(<Menu label="Export" items={items}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    fireEvent(menu, toggleEvent('closed'));
    expect(document.activeElement).toBe(document.body);
    expect(menu.style.left).toBe('');
  });

  it('reports the popup opening and closing', () => {
    const onOpenChange = vi.fn();
    render(<Menu label="Export" items={items} onOpenChange={onOpenChange}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    fireEvent(menu, toggleEvent('open'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent(menu, toggleEvent('closed'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('gives each menu its own popover id', () => {
    render(
      <>
        <Menu label="One" items={items}/>
        <Menu label="Two" items={items}/>
      </>,
    );
    const [one, two] = screen.getAllByRole('menu', {hidden: true});
    expect(one.id).not.toBe(two.id);
    expect(screen.getByRole('button', {name: 'One'})).toHaveAttribute('popovertarget', one.id);
    expect(screen.getByRole('button', {name: 'Two'})).toHaveAttribute('popovertarget', two.id);
  });

  it('renders a text link trigger wired to the popover', () => {
    render(<Menu label="New…" icon={icons.add} items={items} trigger="link" testID="new"/>);
    const trigger = screen.getByRole('button', {name: 'New…'});
    const menu = screen.getByRole('menu', {hidden: true});
    expect(trigger).toHaveClass('ui-menu__link');
    expect(trigger).not.toHaveClass('ui-button');
    expect(trigger).toHaveAttribute('popovertarget', menu.id);
    expect(trigger).toHaveAttribute('data-testid', 'new');
    expect(trigger.textContent).toBe('New…');
    expect(trigger).not.toHaveAttribute('aria-label');
  });

  it('renders a link trigger without an icon, sized like a small button', () => {
    render(<Menu label="Sort" items={items} trigger="link" size="small"/>);
    const trigger = screen.getByRole('button', {name: 'Sort'});
    expect(trigger.childElementCount).toBe(1);
    expect(trigger.firstElementChild?.tagName).toBe('SPAN');
  });

  it('collapses the link trigger to its icon and disables it', () => {
    render(<Menu label="New" icon={icons.add} items={items} trigger="link" hideLabel disabled/>);
    const trigger = screen.getByRole('button', {name: 'New'});
    expect(trigger).toHaveAttribute('aria-label', 'New');
    expect(trigger.textContent).toBe('');
    expect(trigger).toBeDisabled();
  });

  it('marks the active entry with a tick', () => {
    render(<Menu label="Sort" items={[{label: 'Name', active: true}, {label: 'Date'}]}/>);
    // The tick is decoration (`aria-hidden`), so the entry keeps its plain name.
    const name = screen.getByRole('menuitem', {name: 'Name', hidden: true});
    expect(name).toHaveClass('ui-menu__item--active');
    expect(name).toHaveAttribute('aria-current', 'true');
    expect(name.querySelector('.ui-menu__check')).not.toBeNull();
    const date = screen.getByRole('menuitem', {name: 'Date', hidden: true});
    expect(date).not.toHaveClass('ui-menu__item--active');
    expect(date).not.toHaveAttribute('aria-current');
  });

  it('draws a color dot for a swatch entry in place of the icon', () => {
    render(<Menu label="Ink" items={[{label: 'Red', swatch: '#FF0000', icon: icons.star}]}/>);
    const red = screen.getByRole('menuitem', {name: 'Red', hidden: true});
    const dot = red.querySelector('.ui-menu__swatch') as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.style.background).toMatch(/rgb\(255, 0, 0\)|#FF0000/i);
    expect(red.childElementCount).toBe(2);
  });

  it('measures the trigger to place the popup when CSS anchor positioning is missing', async () => {
    // `MenuList` reads `CSS.supports` once at module load, so reload it.
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(false);
    vi.resetModules();
    try {
      const {MenuList} = await import('./list');
      const anchor = document.createElement('button');
      vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({right: 300, bottom: 40} as DOMRect);
      render(<MenuList id="ui-menu-x" items={items} anchor="--ui-menu-x" anchorRef={{current: anchor}}/>);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu).not.toHaveClass('ui-menu__list--anchored');
      expect(menu.style.getPropertyValue('position-anchor')).toBe('');
      fireEvent(menu, toggleEvent('open'));
      expect(menu.style.left).toBe('300px');
      expect(menu.style.top).toBe('44px');

    } finally {
      supports.mockRestore();
    }
  });
  it('opens from the point, not the trigger, without CSS anchor positioning', async () => {
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(false);
    vi.resetModules();
    try {
      const {MenuList} = await import('./list');
      const point = document.createElement('span');
      vi.spyOn(point, 'getBoundingClientRect').mockReturnValue({left: 120, right: 120, bottom: 60} as DOMRect);
      render(<MenuList id="ui-menu-y" items={items} anchor="--ui-menu-y" atPoint anchorRef={{current: point}}/>);
      const menu = screen.getByRole('menu', {hidden: true});
      fireEvent(menu, toggleEvent('open'));
      expect(menu.style.left).toBe('120px');
      expect(menu.style.top).toBe('64px');
    } finally {
      supports.mockRestore();
    }
  });
});