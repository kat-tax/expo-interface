import '@testing-library/jest-dom/vitest';
import type {MenuItem} from '../menu/types';
import {fireEvent, render, screen} from '@testing-library/react';
import {Sheet} from '../sheet';
import {popupOptionId} from './types';
import {PopupMenu} from '.';

const items: MenuItem[] = [{label: 'Heading'}, {label: 'Bullet list'}, {label: 'Quote'}];

type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
  showPopover?: () => void;
  hidePopover?: () => void;
};
const proto = HTMLElement.prototype as PopoverElement;
let open = false;
const menu = () => screen.getByRole('menu', {hidden: true});
const listbox = () => screen.getByRole('listbox', {hidden: true});

/** A toggle event as the browser sends one, in a task of its own. */
function toggle(element: HTMLElement, newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', {value: newState});
  fireEvent(element, event);
}

describe('PopupMenu, steadier (web)', () => {
  beforeAll(() => {
    proto.showPopover = () => {
      open = true;
    };
    proto.hidePopover = () => {
      open = false;
    };
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
      if (selector === ':popover-open') return open;
      return matches.call(this, selector);
    });
  });

  beforeEach(() => {
    open = false;
  });

  afterAll(() => {
    delete proto.showPopover;
    delete proto.hidePopover;
    vi.restoreAllMocks();
  });

  it('reports a pick as a selection, after the entry\'s own press', () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    render(<PopupMenu items={[{label: 'Heading', onPress}]} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    fireEvent.click(screen.getByRole('menuitem', {name: 'Heading', hidden: true}));
    expect(onPress).toHaveBeenCalledTimes(1);
    open = false;
    toggle(menu(), 'closed');
    expect(onDismiss).toHaveBeenCalledWith('select');
    expect(onPress.mock.invocationCallOrder[0]).toBeLessThan(onDismiss.mock.invocationCallOrder[0]!);
  });

  it('says nothing of a close the app asked for by clearing the point', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    rerender(<PopupMenu items={items} at={null} onDismiss={onDismiss}/>);
    toggle(menu(), 'closed');
    expect(onDismiss).not.toHaveBeenCalled();
    // The next close is the user's again.
    rerender(<PopupMenu items={items} at={{x: 20, y: 20}} onDismiss={onDismiss}/>);
    open = false;
    toggle(menu(), 'closed');
    expect(onDismiss).toHaveBeenCalledWith('dismiss');
  });

  it('ignores the late close of a menu that has opened again for the next anchor', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    rerender(<PopupMenu items={items} at={null} onDismiss={onDismiss}/>);
    rerender(<PopupMenu items={items} at={{x: 40, y: 10}} onDismiss={onDismiss}/>);
    // The first menu's close arrives once the second is up: it is over.
    toggle(menu(), 'closed');
    expect(onDismiss).not.toHaveBeenCalled();
    expect(open).toBe(true);
  });

  it('keeps a menu a press moves open, and shows it at the new place once the press is over', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    expect(open).toBe(true);
    // The next handle's button goes down, and the app moves the menu to it.
    document.dispatchEvent(new Event('pointerdown'));
    rerender(<PopupMenu items={items} at={{x: 40, y: 10}} onDismiss={onDismiss}/>);
    // Closed for the press, as the app's own close: the release would dismiss it.
    expect(open).toBe(false);
    toggle(menu(), 'closed');
    expect(onDismiss).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('pointerup'));
    expect(open).toBe(true);
    // The next close is the user's again.
    open = false;
    toggle(menu(), 'closed');
    expect(onDismiss).toHaveBeenCalledWith('dismiss');
  });

  it('reports nothing of the first menu when the point is cleared and set again during a press', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    document.dispatchEvent(new Event('pointerdown'));
    rerender(<PopupMenu items={items} at={null} onDismiss={onDismiss}/>);
    expect(open).toBe(false);
    rerender(<PopupMenu items={items} at={{x: 40, y: 10}} onDismiss={onDismiss}/>);
    // The first menu's close arrives while the button is still down.
    toggle(menu(), 'closed');
    expect(onDismiss).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('pointerup'));
    expect(open).toBe(true);
  });

  it('leaves a press outside a dismissal when the point it is given again has not moved', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    document.dispatchEvent(new Event('pointerdown'));
    // A parent re-render during the press hands in a new object for the same point.
    rerender(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    expect(open).toBe(true);
    // The release dismisses it, as the browser's light dismiss would.
    open = false;
    document.dispatchEvent(new Event('pointerup'));
    toggle(menu(), 'closed');
    expect(onDismiss).toHaveBeenCalledWith('dismiss');
    expect(open).toBe(false);
  });

  it('moves a rectangle\'s menu for a press when only its size changes', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10, width: 80, height: 24}} onDismiss={onDismiss}/>);
    document.dispatchEvent(new Event('pointerdown'));
    rerender(<PopupMenu items={items} at={{x: 10, y: 10, width: 120, height: 24}} onDismiss={onDismiss}/>);
    expect(open).toBe(false);
    toggle(menu(), 'closed');
    document.dispatchEvent(new Event('pointerup'));
    expect(open).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('closes on Escape wherever the focus is, and keeps the key from the editor', () => {
    const onDismiss = vi.fn();
    const editorKey = vi.fn();
    render(
      <>
        <div contentEditable data-testid="editor" onKeyDown={editorKey}/>
        <PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>
      </>,
    );
    fireEvent.keyDown(screen.getByTestId('editor'), {key: 'Escape'});
    expect(open).toBe(false);
    expect(editorKey).not.toHaveBeenCalled();
    toggle(menu(), 'closed');
    expect(onDismiss).toHaveBeenCalledWith('dismiss');
    // Another key, or Escape once the menu is down, is the editor's.
    fireEvent.keyDown(screen.getByTestId('editor'), {key: 'a'});
    fireEvent.keyDown(screen.getByTestId('editor'), {key: 'Escape'});
    expect(editorKey).toHaveBeenCalledTimes(2);
  });

  it('keeps Escape from a web Sheet it is in', () => {
    const onSheetDismiss = vi.fn();
    render(
      <Sheet isPresented onDismiss={onSheetDismiss}>
        <PopupMenu items={items} at={{x: 10, y: 10}}/>
      </Sheet>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    expect(open).toBe(false);
    expect(onSheetDismiss).not.toHaveBeenCalled();
    // Once the menu is down the key is the sheet's.
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    expect(onSheetDismiss).toHaveBeenCalledTimes(1);
  });

  it('anchors at a rectangle\'s box, and opens over it when the top is asked for', () => {
    render(<PopupMenu items={items} at={{x: 10, y: 20, width: 80, height: 24}} preferredEdge="top" testID="popup"/>);
    const anchor = screen.getByTestId('popup');
    expect(anchor.style.width).toBe('80px');
    expect(anchor.style.height).toBe('24px');
    expect(anchor.style.left).toBe('10px');
    // Laid out by CSS anchor positioning over the anchor, flipping when there is no room.
    expect(menu()).toHaveClass('ui-menu__list--point', 'ui-menu__list--above');
  });

  it('leaves the focus where it is as a listbox, with the current entry driven from outside', () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    try {
      const {rerender} = render(<PopupMenu items={items} at={{x: 0, y: 0}} takesFocus={false} highlighted={1} id="slash"/>);
      toggle(listbox(), 'open');
      expect(document.activeElement).toBe(field);
      const list = listbox();
      expect(list.id).toBe('slash');
      const options = screen.getAllByRole('option', {hidden: true});
      expect(options.map(option => option.id)).toEqual([0, 1, 2].map(index => popupOptionId('slash', index)));
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveClass('ui-menu__item--highlighted');
      expect(options[1]).toHaveAttribute('tabindex', '-1');
      expect(scrollIntoView).toHaveBeenCalledWith({block: 'nearest'});
      // The arrows in the field move the highlight; the list's own keys are off.
      rerender(<PopupMenu items={items} at={{x: 0, y: 0}} takesFocus={false} highlighted={2} id="slash"/>);
      expect(screen.getAllByRole('option', {hidden: true})[2]).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(list, {key: 'ArrowDown'});
      expect(document.activeElement).toBe(field);
      // No highlight at all draws none.
      rerender(<PopupMenu items={items} at={{x: 0, y: 0}} takesFocus={false} id="slash"/>);
      expect(screen.getAllByRole('option', {hidden: true}).some(option => option.getAttribute('aria-selected') === 'true')).toBe(false);
    } finally {
      field.remove();
      delete (HTMLElement.prototype as {scrollIntoView?: unknown}).scrollIntoView;
    }
  });

  it('takes the focus to its first entry as it opens by default', () => {
    render(<PopupMenu items={items} at={{x: 0, y: 0}}/>);
    toggle(menu(), 'open');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', {name: 'Heading', hidden: true}));
  });
});
