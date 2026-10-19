import type {MenuItem} from '../menu/types';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {AccentProvider} from '../accent';
import {ContextMenu} from '.';

const items: MenuItem[] = [
  {label: 'Share'},
  {label: 'Delete', role: 'destructive', separator: true},
];

/** A pointer event with a `pointerType`; jsdom has no `PointerEvent` constructor. */
function pointerEvent(type: string, pointerType: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true, ...init});
  Object.defineProperty(event, 'pointerType', {value: pointerType});
  return event;
}

function toggleEvent(newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', {value: newState});
  return event;
}

type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
  showPopover?: () => void;
  hidePopover?: () => void;
};
const proto = HTMLElement.prototype as PopoverElement;
const showPopover = vi.fn();
const hidePopover = vi.fn();

// jsdom 30's UA stylesheet hides closed popovers (`display: none`), so the
// menu is outside the accessibility tree and role queries need `hidden: true`;
// but it still ships no imperative Popover API, so `showPopover` and
// `hidePopover` are stubbed.
describe('ContextMenu (web)', () => {
  beforeAll(() => {
    proto.showPopover = showPopover;
    proto.hidePopover = hidePopover;
  });

  afterAll(() => {
    delete proto.showPopover;
    delete proto.hidePopover;
  });

  it('wraps the content and its popover menu in a layout-neutral element', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Holiday photos</span>
      </ContextMenu>,
    );
    const wrapper = screen.getByTestId('row');
    expect(wrapper).toHaveClass('ui-context-menu');
    expect(wrapper).toHaveTextContent('Holiday photos');
    const menu = screen.getByRole('menu', {hidden: true});
    expect(menu).not.toBeVisible();
    expect(menu.parentElement).toBe(wrapper);
    expect(menu).toHaveAttribute('popover', 'auto');
    expect(menu).not.toHaveClass('ui-menu__list--anchored');
    expect(screen.getAllByRole('menuitem', {hidden: true}).map(e => e.textContent)).toEqual(['Share', 'Delete']);
    expect(screen.getByRole('menuitem', {name: 'Delete', hidden: true})).toHaveClass('ui-menu__item--destructive');
    expect(screen.getByRole('separator', {hidden: true})).toBeInTheDocument();
  });

  it('draws the menu on a material of its own, or the app\'s, and as itself otherwise', () => {
    const {rerender} = render(
      <ContextMenu items={items} material="thick">
        <span>Item</span>
      </ContextMenu>,
    );
    const menu = () => screen.getByRole('menu', {hidden: true});
    expect(menu()).toHaveAttribute('data-material', 'thick');
    expect(menu()).toHaveAttribute('data-material-fill', 'element');
    expect(menu()).toHaveAttribute('data-material-edge', 'float');
    rerender(
      <AccentProvider overlayMaterial="regular">
        <ContextMenu items={items}>
          <span>Item</span>
        </ContextMenu>
      </AccentProvider>,
    );
    expect(menu()).toHaveAttribute('data-material', 'regular');
    rerender(
      <ContextMenu items={items}>
        <span>Item</span>
      </ContextMenu>,
    );
    expect(menu()).not.toHaveAttribute('data-material');
  });

  it('opens the menu at the pointer on right-click', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const notCancelled = fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 40, clientY: 60});
    expect(notCancelled).toBe(false);
    expect(showPopover).toHaveBeenCalledTimes(1);
    const menu = screen.getByRole('menu', {hidden: true});
    expect(menu.style.left).toBe('40px');
    expect(menu.style.top).toBe('60px');
  });

  it('does not call showPopover while already open', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const menu = screen.getByRole('menu', {hidden: true});
    vi.spyOn(menu, 'matches').mockImplementation(selector => selector === ':popover-open');
    fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 1, clientY: 2});
    expect(showPopover).not.toHaveBeenCalled();
  });

  describe('a right click raised while its button is down (Linux, macOS)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const row = () => screen.getByTestId('row');
    const release = (type = 'pointerup') => fireEvent(document.body, pointerEvent(type, 'mouse'));

    it('opens once the button comes up, in a task after the release, where its light dismiss is over', () => {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      expect(fireEvent.contextMenu(row(), {clientX: 40, clientY: 60, buttons: 2})).toBe(false);
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();
      release();
      expect(showPopover).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('40px');
      expect(menu.style.top).toBe('60px');
      release();
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it('opens after a press the browser cancels, and once for the last of two right clicks', () => {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.contextMenu(row(), {clientX: 1, clientY: 2, buttons: 2});
      fireEvent.contextMenu(row(), {clientX: 30, clientY: 40, buttons: 2});
      release('pointercancel');
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('menu', {hidden: true}).style.left).toBe('30px');
    });

    it('opens nothing for content gone before the release, or between the release and its task', () => {
      const first = render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.contextMenu(row(), {buttons: 2});
      first.unmount();
      release();
      act(() => vi.advanceTimersByTime(0));
      const second = render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.contextMenu(row(), {buttons: 2});
      release();
      second.unmount();
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).not.toHaveBeenCalled();
    });
  });

  it('reports the popup opening and closing', () => {
    const onOpenChange = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ContextMenu items={items} onOpenChange={onOpenChange} onDismiss={onDismiss} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const menu = screen.getByRole('menu', {hidden: true});
    fireEvent(menu, toggleEvent('open'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent(menu, toggleEvent('closed'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe('a held touch', () => {
    const onPress = vi.fn();
    const row = () => screen.getByTestId('row');

    beforeEach(() => {
      vi.useFakeTimers();
      render(
        <ContextMenu items={items} onPress={onPress} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens once the touch lifts, in a task after the release\'s click, which does not press the content', () => {
      fireEvent(row(), pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(500));
      // Armed, not shown: a menu shown while the touch is down would be
      // dismissed by the release.
      expect(showPopover).not.toHaveBeenCalled();
      fireEvent(row(), pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(screen.getByText('Item'))).toBe(false);
      expect(onPress).not.toHaveBeenCalled();
      expect(showPopover).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('10px');
      expect(menu.style.top).toBe('20px');
      act(() => vi.advanceTimersByTime(300));
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it('opens a grace after a release no click follows, and swallows a click that comes late', () => {
      fireEvent(row(), pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(row(), pointerEvent('pointerup', 'touch'));
      act(() => vi.advanceTimersByTime(299));
      expect(showPopover).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(fireEvent.click(screen.getByText('Item'))).toBe(false);
      expect(onPress).not.toHaveBeenCalled();
    });

    it('opens nothing for a touch lifted or moved before the hold, or cancelled after it, and leaves the click to the content', () => {
      fireEvent(row(), pointerEvent('pointerdown', 'touch'));
      fireEvent(row(), pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(screen.getByText('Item'))).toBe(true);
      expect(onPress).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();

      fireEvent(row(), pointerEvent('pointerdown', 'touch'));
      fireEvent(row(), pointerEvent('pointermove', 'touch'));
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();

      fireEvent(row(), pointerEvent('pointerdown', 'touch'));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(row(), pointerEvent('pointercancel', 'touch'));
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();
    });

    it('opens once where the browser raises contextmenu for the held touch as well', () => {
      fireEvent(row(), pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent.contextMenu(row(), {clientX: 11, clientY: 21});
      expect(showPopover).toHaveBeenCalledTimes(1);
      fireEvent(row(), pointerEvent('pointerup', 'touch'));
      act(() => vi.advanceTimersByTime(300));
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('11px');
    });

    it('leaves a press on an entry of its own menu to the menu', () => {
      const entry = screen.getByRole('menuitem', {name: 'Share', hidden: true});
      fireEvent(entry, pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(entry, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(entry)).toBe(true);
      act(() => vi.advanceTimersByTime(300));
      expect(showPopover).not.toHaveBeenCalled();
    });
  });

  it('ignores mouse pointers for the long-press', () => {
    vi.useFakeTimers();
    try {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent(screen.getByTestId('row'), pointerEvent('pointerdown', 'mouse'));
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  describe('trigger', () => {
    it('opens on a click when asked, at the pointer, instead of calling onPress', () => {
      const onPress = vi.fn();
      render(
        <ContextMenu items={items} trigger="tap" onPress={onPress} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.click(screen.getByTestId('row'), {clientX: 12, clientY: 34});
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('12px');
      expect(menu.style.top).toBe('34px');
      // The click is the menu, so there is no gesture left for `onPress`.
      expect(onPress).not.toHaveBeenCalled();
    });

    it('keeps the right click, which is what the platform and its screen readers reach for', () => {
      render(
        <ContextMenu items={items} trigger="tap" testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      expect(fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 40, clientY: 60})).toBe(false);
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it('drops the touch long-press, so one intent does not open the menu twice', () => {
      vi.useFakeTimers();
      try {
        render(
          <ContextMenu items={items} trigger="tap" testID="row">
            <span>Item</span>
          </ContextMenu>,
        );
        fireEvent(screen.getByTestId('row'), pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
        act(() => vi.advanceTimersByTime(1000));
        expect(showPopover).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('opens nothing on a click while disabled', () => {
      render(
        <ContextMenu items={items} trigger="tap" disabled testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.click(screen.getByTestId('row'));
      expect(showPopover).not.toHaveBeenCalled();
    });
  });

  it('passes a plain click to onPress', () => {
    const onPress = vi.fn();
    render(
      <ContextMenu items={items} onPress={onPress} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('keyboard and screen readers', () => {
    it('makes the content a button in the tab order when the press is its own, pressed by Enter and Space', () => {
      const onPress = vi.fn();
      render(
        <ContextMenu items={items} onPress={onPress} testID="row">
          <div>Holiday photos</div>
        </ContextMenu>,
      );
      // The wrapper is `display: contents`, which no browser focuses: the content's own element is the button.
      const button = screen.getByRole('button', {name: 'Holiday photos'});
      expect(button.parentElement).toBe(screen.getByTestId('row'));
      expect(button).toHaveAttribute('tabindex', '0');
      expect(fireEvent.keyDown(button, {key: 'Enter'})).toBe(false);
      expect(fireEvent.keyDown(button, {key: ' '})).toBe(false);
      expect(onPress).toHaveBeenCalledTimes(2);
      // Another key, or a key in the menu, presses nothing.
      expect(fireEvent.keyDown(button, {key: 'a'})).toBe(true);
      fireEvent.keyDown(screen.getByRole('menuitem', {name: 'Share', hidden: true}), {key: 'Enter'});
      expect(onPress).toHaveBeenCalledTimes(2);
      expect(showPopover).not.toHaveBeenCalled();
    });

    it('keeps the button and its focus through a render, and makes new content the button in its place', () => {
      const {rerender} = render(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <div>Holiday photos</div>
        </ContextMenu>,
      );
      const button = screen.getByRole('button', {name: 'Holiday photos'});
      button.focus();
      rerender(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <div>Holiday photos</div>
        </ContextMenu>,
      );
      expect(document.activeElement).toBe(button);
      expect(button).toHaveAttribute('role', 'button');
      rerender(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <p>Trip</p>
        </ContextMenu>,
      );
      expect(screen.getByRole('button', {name: 'Trip'})).toHaveAttribute('tabindex', '0');
    });

    it('opens the menu at the content\'s centre from the keyboard for `tap`', () => {
      render(
        <ContextMenu items={items} trigger="tap" testID="row">
          <div>Item</div>
        </ContextMenu>,
      );
      const button = screen.getByRole('button', {name: 'Item'});
      button.getBoundingClientRect = () => ({left: 10, top: 20, width: 100, height: 40} as DOMRect);
      fireEvent.keyDown(button, {key: 'Enter'});
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('60px');
      expect(menu.style.top).toBe('40px');
    });

    it('leaves the content alone without a press of its own, while disabled, and when it is a control already', () => {
      const {rerender} = render(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <div>Item</div>
        </ContextMenu>,
      );
      expect(screen.getByRole('button', {name: 'Item'})).toBeInTheDocument();
      rerender(
        <ContextMenu items={items} onPress={vi.fn()} disabled testID="row">
          <div>Item</div>
        </ContextMenu>,
      );
      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.getByText('Item')).not.toHaveAttribute('tabindex');
      rerender(
        <ContextMenu items={items} testID="row">
          <div>Item</div>
        </ContextMenu>,
      );
      expect(screen.queryByRole('button')).toBeNull();
      // A control of its own keeps its role and its keys, which press it.
      rerender(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <a href="#photos" role="link">Photos</a>
        </ContextMenu>,
      );
      expect(screen.getByRole('link', {name: 'Photos'})).not.toHaveAttribute('tabindex');
      rerender(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          <button type="button">Open</button>
        </ContextMenu>,
      );
      expect(screen.getByRole('button', {name: 'Open'})).not.toHaveAttribute('role');
      expect(fireEvent.keyDown(screen.getByRole('button', {name: 'Open'}), {key: 'Enter'})).toBe(true);
    });

    it('has no button for content with no element of its own', () => {
      render(
        <ContextMenu items={items} onPress={vi.fn()} testID="row">
          Item
        </ContextMenu>,
      );
      expect(screen.queryByRole('button')).toBeNull();
      // The menu's popover, the wrapper's only element then, keeps its own role.
      expect(screen.getByRole('menu', {hidden: true})).toBeInTheDocument();
    });
  });

  it('does nothing when disabled', () => {
    const onPress = vi.fn();
    render(
      <ContextMenu items={items} onPress={onPress} disabled testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const row = screen.getByTestId('row');
    expect(fireEvent.contextMenu(row)).toBe(true);
    fireEvent.click(row);
    expect(showPopover).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls the entry handler when an entry is picked', () => {
    const onDelete = vi.fn();
    render(
      <ContextMenu items={[{label: 'Delete', role: 'destructive', onPress: onDelete}]}>
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByRole('menuitem', {name: 'Delete', hidden: true}));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  // The popover is inside the wrapper, so what happens on it reaches the
  // wrapper's handlers, whichever gesture opens the menu.
  describe.each(['longPress', 'tap'] as const)('a gesture on its own menu, for %s', trigger => {
    const onPress = vi.fn();
    const onShare = vi.fn();

    beforeEach(() => {
      render(
        <ContextMenu items={[{label: 'Share', onPress: onShare}]} trigger={trigger} onPress={onPress} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
    });

    it('takes an entry\'s click as the menu\'s: the content is not pressed and the menu does not open again', () => {
      fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 40, clientY: 60});
      expect(showPopover).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('menuitem', {name: 'Share', hidden: true}), {clientX: 50, clientY: 70});
      expect(onShare).toHaveBeenCalledTimes(1);
      expect(onPress).not.toHaveBeenCalled();
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu', {hidden: true});
      expect(menu.style.left).toBe('40px');
      expect(menu.style.top).toBe('60px');
    });

    it('keeps the browser\'s menu off its own, and opens nothing for a right click on it', () => {
      expect(fireEvent.contextMenu(screen.getByRole('menuitem', {name: 'Share', hidden: true}), {clientX: 5, clientY: 6})).toBe(false);
      expect(showPopover).not.toHaveBeenCalled();
      expect(screen.getByRole('menu', {hidden: true}).style.left).toBe('');
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  it('keeps the popup inside the viewport when it opens', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 5000, clientY: -50});
    const menu = screen.getByRole('menu', {hidden: true});
    fireEvent(menu, toggleEvent('open'));
    expect(menu.style.left).toBe(`${window.innerWidth - 8}px`);
    expect(menu.style.top).toBe('8px');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', {name: 'Share', hidden: true}));
  });

  it('opens at the point given by `at`, relative to the content, and reports the close', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(
      <ContextMenu items={items} at={{x: 40, y: 60}} onDismiss={onDismiss} testID="row">
        <span>Canvas</span>
      </ContextMenu>,
    );
    const content = screen.getByText('Canvas');
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({left: 100, top: 200} as DOMRect);
    expect(showPopover).toHaveBeenCalledTimes(1);
    const menu = screen.getByRole('menu', {hidden: true});
    // The first measurement happened before the spy: the point is taken as given.
    expect(menu.style.left).toBe('40px');
    expect(menu.style.top).toBe('60px');

    rerender(
      <ContextMenu items={items} at={{x: 10, y: 20}} onDismiss={onDismiss} testID="row">
        <span>Canvas</span>
      </ContextMenu>,
    );
    expect(showPopover).toHaveBeenCalledTimes(2);
    expect(menu.style.left).toBe('110px');
    expect(menu.style.top).toBe('220px');

    fireEvent(menu, toggleEvent('closed'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not reopen for `at` while already open, disabled, or cleared', () => {
    const {rerender} = render(
      <ContextMenu items={items} at={{x: 1, y: 2}} disabled testID="row">
        <span>Canvas</span>
      </ContextMenu>,
    );
    expect(showPopover).not.toHaveBeenCalled();

    rerender(
      <ContextMenu items={items} at={null} testID="row">
        <span>Canvas</span>
      </ContextMenu>,
    );
    expect(showPopover).not.toHaveBeenCalled();

    const menu = screen.getByRole('menu', {hidden: true});
    vi.spyOn(menu, 'matches').mockImplementation(selector => selector === ':popover-open');
    rerender(
      <ContextMenu items={items} at={{x: 3, y: 4}} testID="row">
        <span>Canvas</span>
      </ContextMenu>,
    );
    expect(showPopover).not.toHaveBeenCalled();
    expect(menu.style.left).toBe('3px');
  });

  it('measures `at` from the viewport when the content has no element of its own', () => {
    render(
      <ContextMenu items={items} at={{x: 5, y: 6}} testID="row">
        Plain text
      </ContextMenu>,
    );
    const menu = screen.getByRole('menu', {hidden: true});
    expect(menu.style.left).toBe('5px');
    expect(menu.style.top).toBe('6px');
  });

  it('closes on Escape wherever the focus is, and keeps the key from the document', () => {
    const heard = vi.fn();
    const listener = (event: KeyboardEvent) => heard(event.key);
    document.addEventListener('keydown', listener, true);
    try {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 40, clientY: 60});
      const menu = screen.getByRole('menu', {hidden: true});
      // Shown: the key is the menu's from then on.
      vi.spyOn(menu, 'matches').mockImplementation(selector => selector === ':popover-open');
      fireEvent.keyDown(screen.getByRole('menuitem', {name: 'Share', hidden: true}), {key: 'Escape'});
      expect(hidePopover).toHaveBeenCalledTimes(1);
      expect(heard).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', listener, true);
    }
  });

  it('ignores a lift or move without a pending long-press', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const row = screen.getByTestId('row');
    fireEvent(row, pointerEvent('pointerup', 'touch'));
    fireEvent(row, pointerEvent('pointercancel', 'touch'));
    fireEvent(row, pointerEvent('pointermove', 'touch'));
    expect(showPopover).not.toHaveBeenCalled();
  });
});
