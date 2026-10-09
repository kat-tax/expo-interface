// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {ReactElement} from 'react';
import type {MenuItem} from './types';
import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Sheet} from '../sheet';
import {MenuList} from './list';
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
    expect(entries.map(e => e.querySelector('.ui-menu__label')?.textContent)).toEqual(['Share', 'Rename', 'Delete']);
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

  it('marks a trigger that is on as pressed, drawn filled, on the button and on the link', () => {
    const {rerender} = render(<Menu label="Shapes" items={items} variant="text" pressed/>);
    const button = screen.getByRole('button', {name: 'Shapes'});
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveClass('ui-button--filled');
    expect(button).toHaveAttribute('popovertarget');
    rerender(<Menu label="Shapes" items={items} trigger="link" pressed/>);
    const link = screen.getByRole('button', {name: 'Shapes'});
    expect(link).toHaveClass('ui-menu__link');
    expect(link).toHaveAttribute('aria-pressed', 'true');
    rerender(<Menu label="Shapes" items={items} trigger="link"/>);
    expect(screen.getByRole('button', {name: 'Shapes'})).not.toHaveAttribute('aria-pressed');
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
    expect(trigger.querySelector('.ui-menu__label')).toHaveTextContent('New…');
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
    expect(trigger.querySelector('.ui-menu__label')).toBeNull();
    expect(trigger.querySelector('.ui-symbol')).toHaveTextContent('add');
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

  it('takes the anchor once a static page has hydrated', () => {
    // A fixed id: `useId` writes a client render's ids apart from a hydrated one's.
    const tree = <MenuList id="ui-menu-new" items={[{label: 'Blank document'}, {label: 'Import files'}]} anchor="--ui-menu-new"/>;
    // The page as a static export's server draws it: with no `CSS` to ask, so with no anchor.
    const container = document.createElement('div');
    vi.stubGlobal('CSS', undefined);
    try {
      const server = render(tree);
      container.innerHTML = server.container.innerHTML;
      server.unmount();
    } finally {
      vi.unstubAllGlobals();
    }
    document.body.append(container);
    const popover = () => container.querySelector('[popover]') as HTMLElement;
    expect(popover()).not.toHaveClass('ui-menu__list--anchored');
    expect(popover().style.getPropertyValue('position-anchor')).toBe('');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const {unmount} = render(tree, {container, hydrate: true});
      // Hydration matches the HTML, so React reports no difference, and the
      // render after it takes the anchor, which hydration would not patch in.
      expect(errors).not.toHaveBeenCalled();
      expect(popover()).toHaveClass('ui-menu__list--anchored');
      expect(popover().style.getPropertyValue('position-anchor')).toBe('--ui-menu-new');
      unmount();
    } finally {
      errors.mockRestore();
      container.remove();
    }
  });

  it('hydrates a static page\'s Menu without a difference, and anchors its popup to its own trigger', async () => {
    // The one function of `react-dom/server` this calls: the repository carries no types for react-dom.
    const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
    const tree = <Menu label="New" items={[{label: 'Blank document'}, {label: 'Import files'}]} testID="new"/>;
    // What a static export writes: the server's render, with the server's answer for the anchor.
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = renderToString(tree);
    const popover = () => container.querySelector('[popover]') as HTMLElement;
    const wrapper = () => container.querySelector('.ui-menu') as HTMLElement;
    expect(popover()).not.toHaveClass('ui-menu__list--anchored');
    // A press before the page runs opens nothing: the trigger has no target yet.
    expect(screen.getByTestId('new')).not.toHaveAttribute('popovertarget');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const {unmount} = render(tree, {container, hydrate: true});
      expect(errors).not.toHaveBeenCalled();
      expect(popover()).toHaveClass('ui-menu__list--anchored');
      // The ids `useId` gave the server are the ones hydration keeps, so the
      // trigger opens this popup and the popup is placed against this trigger.
      expect(screen.getByTestId('new')).toHaveAttribute('popovertarget', popover().id);
      expect(popover().style.getPropertyValue('position-anchor')).toBe(wrapper().style.getPropertyValue('anchor-name'));
      expect(popover().style.getPropertyValue('position-anchor')).toMatch(/^--ui-menu-/);
      unmount();
    } finally {
      errors.mockRestore();
      container.remove();
    }
  });

  it('gives a link trigger its popover target once a static page has hydrated, and not before', async () => {
    const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
    const tree = <Menu label="New" items={[{label: 'Blank document'}]} trigger="link" testID="new"/>;
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

  it('measures the trigger to place the popup when CSS anchor positioning is missing', () => {
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(false);
    try {
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

  it('opens from the point, not the trigger, without CSS anchor positioning', () => {
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(false);
    try {
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

  it('opens over the point when the top is asked for, without CSS anchor positioning', () => {
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(false);
    try {
      const point = document.createElement('span');
      vi.spyOn(point, 'getBoundingClientRect').mockReturnValue({left: 120, right: 200, top: 100, bottom: 124} as DOMRect);
      render(<MenuList id="ui-menu-z" items={items} anchor="--ui-menu-z" atPoint edge="top" anchorRef={{current: point}}/>);
      const menu = screen.getByRole('menu', {hidden: true});
      fireEvent(menu, toggleEvent('open'));
      // Over the anchor's top less a gap; jsdom lays the popup out with no height.
      expect(menu.style.top).toBe('96px');
      expect(menu).not.toHaveClass('ui-menu__list--above');
    } finally {
      supports.mockRestore();
    }
  });
});

describe('Escape on an open menu (web)', () => {
  type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  const proto = HTMLElement.prototype as PopoverElement;
  /** The popovers the browser has open; jsdom ships no imperative Popover API, so it is stubbed. */
  const open = new Set<Element>();
  const hidePopover = vi.fn(function (this: HTMLElement) {
    open.delete(this);
  });
  let matches: {mockRestore: () => void} | undefined;

  beforeAll(() => {
    proto.showPopover = function (this: HTMLElement) {
      open.add(this);
    };
    proto.hidePopover = hidePopover;
    const original = HTMLElement.prototype.matches;
    matches = vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
      return selector === ':popover-open' ? open.has(this) : original.call(this, selector);
    });
  });

  afterEach(() => {
    open.clear();
  });

  afterAll(() => {
    delete proto.showPopover;
    delete proto.hidePopover;
    matches?.mockRestore();
  });

  /** Opens the menu as the trigger's `popovertarget` would: shown, then reported by the browser. */
  const show = (menu: HTMLElement) => {
    menu.showPopover();
    fireEvent(menu, toggleEvent('open'));
  };

  it('closes the menu and leaves a web Sheet around it up, which the next Escape is for', () => {
    const onSheetDismiss = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Sheet isPresented onDismiss={onSheetDismiss}>
        <Menu label="More" items={items} onOpenChange={onOpenChange}/>
      </Sheet>,
    );
    const menu = screen.getByRole('menu', {hidden: true});
    show(menu);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // The key goes down on the focused entry and would reach the document, where the drawer listens.
    fireEvent.keyDown(screen.getByRole('menuitem', {name: 'Share', hidden: true}), {key: 'Escape'});
    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(open.has(menu)).toBe(false);
    expect(onSheetDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The browser reports the close; the next Escape is the sheet's.
    fireEvent(menu, toggleEvent('closed'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    expect(onSheetDismiss).toHaveBeenCalledTimes(1);
  });

  it('takes the key as soon as the popover shows, keeps it from the document, and gives it up once the popover is hidden', () => {
    const heard = vi.fn();
    const listener = (event: KeyboardEvent) => heard(event.key);
    document.addEventListener('keydown', listener, true);
    try {
      render(<Menu label="More" items={items}/>);
      const menu = screen.getByRole('menu', {hidden: true});
      // Shown, and not yet reported by the browser's `toggle`: the key is the menu's already.
      menu.showPopover();
      fireEvent.keyDown(menu, {key: 'Escape'});
      expect(hidePopover).toHaveBeenCalledTimes(1);
      expect(open.has(menu)).toBe(false);
      expect(heard).not.toHaveBeenCalled();
      // Hidden again by a click outside, whatever the browser has reported: the key is the page's.
      show(menu);
      open.delete(menu);
      fireEvent.keyDown(menu, {key: 'Escape'});
      expect(hidePopover).toHaveBeenCalledTimes(1);
      expect(heard).toHaveBeenCalledWith('Escape');
    } finally {
      document.removeEventListener('keydown', listener, true);
    }
  });
});

describe('the menu keyboard pattern', () => {
  /** What `role="menu"` promises anyone without a pointer. */
  const press = (key: string) => fireEvent.keyDown(screen.getByRole('menu', {hidden: true}), {key});
  const menuItems = () => screen.getAllByRole('menuitem', {hidden: true});

  it('is one stop in the tab order, on the checked entry when there is one', () => {
    render(<Menu label="More" items={[{label: 'Share'}, {label: 'Rename', active: true}, {label: 'Delete'}]}/>);
    expect(menuItems().map(item => item.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('walks with the arrows, wraps at the ends, and reaches both with Home and End', () => {
    render(<Menu label="More" items={items}/>);
    const entries = menuItems();
    entries[0]!.focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(entries[1]);
    press('ArrowUp');
    expect(document.activeElement).toBe(entries[0]);
    press('ArrowUp');
    expect(document.activeElement).toBe(entries.at(-1));
    press('Home');
    expect(document.activeElement).toBe(entries[0]);
    press('End');
    expect(document.activeElement).toBe(entries.at(-1));
  });

  it('jumps to an entry by typing its first letter, reading past the icon', () => {
    render(<Menu label="More" items={items}/>);
    const entries = menuItems();
    entries[0]!.focus();
    vi.useFakeTimers();
    try {
      // "Delete" carries a trash glyph, drawn as the ligature `delete`. It is
      // aria-hidden, so it is not what `d` should be matching — and "Rename",
      // which has no icon, must still be reachable by `r`.
      press('d');
      expect(document.activeElement).toHaveTextContent('Delete');
      // Long enough that this is a new word rather than "dr", which matches
      // nothing and would rightly move nowhere.
      vi.advanceTimersByTime(700);
      press('r');
      expect(document.activeElement).toHaveTextContent('Rename');
    } finally {
      vi.useRealTimers();
    }
  });
});
