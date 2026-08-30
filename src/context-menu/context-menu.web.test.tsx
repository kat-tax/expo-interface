import type {MenuItem} from '../menu/types';
import {act, fireEvent, render, screen} from '@testing-library/react';
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

type PopoverElement = Omit<HTMLElement, 'showPopover'> & {showPopover?: () => void};
const proto = HTMLElement.prototype as PopoverElement;
const showPopover = jest.fn();

describe('ContextMenu (web)', () => {
  beforeAll(() => {
    // jsdom does not implement the Popover API.
    proto.showPopover = showPopover;
  });

  afterAll(() => {
    delete proto.showPopover;
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
    const menu = screen.getByRole('menu');
    expect(menu.parentElement).toBe(wrapper);
    expect(menu).toHaveAttribute('popover', 'auto');
    expect(menu).not.toHaveClass('ui-menu__list--anchored');
    expect(screen.getAllByRole('menuitem').map(e => e.textContent)).toEqual(['Share', 'Delete']);
    expect(screen.getByRole('menuitem', {name: 'Delete'})).toHaveClass('ui-menu__item--destructive');
    expect(screen.getByRole('separator')).toBeInTheDocument();
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
    const menu = screen.getByRole('menu');
    expect(menu.style.left).toBe('40px');
    expect(menu.style.top).toBe('60px');
  });

  it('does not call showPopover while already open', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    const menu = screen.getByRole('menu');
    jest.spyOn(menu, 'matches').mockImplementation(selector => selector === ':popover-open');
    fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 1, clientY: 2});
    expect(showPopover).not.toHaveBeenCalled();
  });

  it('opens after a touch long-press and cancels when the finger lifts or moves', () => {
    jest.useFakeTimers();
    try {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      const row = screen.getByTestId('row');
      fireEvent(row, pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => jest.advanceTimersByTime(499));
      expect(showPopover).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(1));
      expect(showPopover).toHaveBeenCalledTimes(1);
      const menu = screen.getByRole('menu');
      expect(menu.style.left).toBe('10px');
      expect(menu.style.top).toBe('20px');

      showPopover.mockClear();
      fireEvent(row, pointerEvent('pointerdown', 'touch'));
      fireEvent(row, pointerEvent('pointerup', 'touch'));
      act(() => jest.advanceTimersByTime(500));
      expect(showPopover).not.toHaveBeenCalled();

      fireEvent(row, pointerEvent('pointerdown', 'touch'));
      fireEvent(row, pointerEvent('pointermove', 'touch'));
      act(() => jest.advanceTimersByTime(500));
      expect(showPopover).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores mouse pointers for the long-press', () => {
    jest.useFakeTimers();
    try {
      render(
        <ContextMenu items={items} testID="row">
          <span>Item</span>
        </ContextMenu>,
      );
      fireEvent(screen.getByTestId('row'), pointerEvent('pointerdown', 'mouse'));
      act(() => jest.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('passes a plain click to onPress', () => {
    const onPress = jest.fn();
    render(
      <ContextMenu items={items} onPress={onPress} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    const onPress = jest.fn();
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
    const onDelete = jest.fn();
    render(
      <ContextMenu items={[{label: 'Delete', role: 'destructive', onPress: onDelete}]}>
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByRole('menuitem', {name: 'Delete'}));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('keeps the popup inside the viewport when it opens', () => {
    render(
      <ContextMenu items={items} testID="row">
        <span>Item</span>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId('row'), {clientX: 5000, clientY: -50});
    const menu = screen.getByRole('menu');
    fireEvent(menu, toggleEvent('open'));
    expect(menu.style.left).toBe(`${window.innerWidth - 8}px`);
    expect(menu.style.top).toBe('8px');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', {name: 'Share'}));
  });
});
