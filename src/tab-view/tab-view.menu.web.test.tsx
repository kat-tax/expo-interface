import '@testing-library/jest-dom/vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {DEPTH_INDENT} from './draw';
import {TabView} from '.';

const TABS = [
  {id: 'a', title: 'Notes', menu: [{label: 'Rename'}, {label: 'Close others'}]},
  {id: 'b', title: 'Sketch', depth: 1, accessory: <em>typing</em>},
];

type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
  showPopover?: () => void;
  hidePopover?: () => void;
};
const proto = HTMLElement.prototype as PopoverElement;

function windowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {value: width, configurable: true, writable: true});
}

/** A pointer event with a `pointerType`; jsdom has no `PointerEvent` constructor. */
function pointerEvent(type: string, pointerType: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true, ...init});
  Object.defineProperty(event, 'pointerType', {value: pointerType});
  return event;
}

describe('TabView tab menus, depth and accessories (web)', () => {
  beforeAll(() => {
    proto.showPopover = () => {};
    proto.hidePopover = () => {};
  });

  afterAll(() => {
    delete proto.showPopover;
    delete proto.hidePopover;
  });

  beforeEach(() => {
    windowWidth(1024);
  });

  it('indents a nested tab by its depth, draws an accessory after the title, and says a tab has a menu', () => {
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    const [notes, sketch] = screen.getAllByRole('tab');
    expect(notes).toHaveAttribute('aria-haspopup', 'menu');
    expect(sketch).not.toHaveAttribute('aria-haspopup');
    expect(sketch.parentElement!.style.paddingLeft).toBe(`${12 + DEPTH_INDENT}px`);
    expect(notes.parentElement!.style.paddingLeft).toBe('');
    expect(sketch).toHaveTextContent('typing');
  });

  it('opens a tab\'s menu at the pointer on a right click, in the strip\'s own coordinates', () => {
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    const [notes, sketch] = screen.getAllByRole('tab');
    fireEvent.contextMenu(notes, {clientX: 140, clientY: 30});
    const anchor = screen.getByTestId('t-menu');
    expect(anchor.style.left).toBe('140px');
    expect(anchor.style.top).toBe('30px');
    expect(screen.getByRole('menuitem', {name: 'Rename', hidden: true})).toBeInTheDocument();
    // A tab without a menu leaves the browser's own.
    fireEvent.contextMenu(sketch, {clientX: 300, clientY: 30});
    expect(anchor.style.left).toBe('140px');
    // The browser closes the popup (Escape, a click outside): the strip forgets the point.
    const menu = screen.getByRole('menu', {hidden: true});
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', {value: 'closed'});
    act(() => {
      menu.dispatchEvent(event);
    });
    expect(anchor.style.left).toBe('0px');
  });

  it('opens the menu at the tab\'s own corner for the Menu key, which reports no point', () => {
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    const [notes] = screen.getAllByRole('tab');
    vi.spyOn(notes, 'getBoundingClientRect').mockReturnValue({left: 50, bottom: 44, top: 0, right: 170, width: 120, height: 44, x: 50, y: 0, toJSON: () => ({})});
    fireEvent.contextMenu(notes, {clientX: 0, clientY: 0});
    const anchor = screen.getByTestId('t-menu');
    expect(anchor.style.left).toBe('50px');
    expect(anchor.style.top).toBe('44px');
  });

  it('gives the switcher\'s cards the same menu, depth and accessory', () => {
    windowWidth(400);
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    fireEvent.click(screen.getByTestId('t-switcher'));
    const [notes, sketch] = screen.getAllByRole('tab');
    expect(notes).toHaveAttribute('aria-haspopup', 'menu');
    expect(sketch.style.paddingLeft).toBe(`${16 + DEPTH_INDENT}px`);
    expect(sketch).toHaveTextContent('typing');
    fireEvent.contextMenu(notes, {clientX: 20, clientY: 90});
    expect(screen.getByTestId('t-menu').style.top).toBe('90px');
  });

  describe('a held touch', () => {
    const rename = () => screen.queryByRole('menuitem', {name: 'Rename', hidden: true});

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens a tab\'s menu at a touch held for half a second, as the web ContextMenu does', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(499));
      expect(rename()).toBeNull();
      act(() => vi.advanceTimersByTime(1));
      expect(rename()).toBeInTheDocument();
      const anchor = screen.getByTestId('t-menu');
      expect(anchor.style.left).toBe('140px');
      expect(anchor.style.top).toBe('30px');
    });

    it('opens nothing for a touch lifted, moved or cancelled before then, nor for a mouse', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      for (const end of ['pointerup', 'pointermove', 'pointercancel']) {
        fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
        fireEvent(notes, pointerEvent(end, 'touch'));
        act(() => vi.advanceTimersByTime(500));
        expect(rename()).toBeNull();
      }
      // A mouse has the right click, and its lift has no hold to end.
      fireEvent(notes, pointerEvent('pointerdown', 'mouse', {clientX: 140, clientY: 30}));
      fireEvent(notes, pointerEvent('pointerup', 'mouse'));
      act(() => vi.advanceTimersByTime(500));
      expect(rename()).toBeNull();
    });

    it('opens the menu once where the browser raises contextmenu for the held touch as well', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      // Chrome on Android: `contextmenu` at the hold, a little off the touch's point.
      fireEvent.contextMenu(notes, {clientX: 141, clientY: 31});
      const anchor = screen.getByTestId('t-menu');
      expect(rename()).toBeInTheDocument();
      expect(anchor.style.left).toBe('141px');
      act(() => vi.advanceTimersByTime(500));
      // The hold ended with the `contextmenu`: the menu stays where that opened it.
      expect(anchor.style.left).toBe('141px');
      expect(anchor.style.top).toBe('31px');
    });

    it('leaves a tab without a menu alone', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      const [, sketch] = screen.getAllByRole('tab');
      fireEvent(sketch, pointerEvent('pointerdown', 'touch', {clientX: 300, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      expect(screen.queryByRole('menuitem', {hidden: true})).toBeNull();
    });

    it('forgets a touch still held when the view goes', () => {
      const {unmount} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      unmount();
      expect(() => act(() => vi.advanceTimersByTime(500))).not.toThrow();
    });

    it('opens a card\'s menu at the touch too', () => {
      windowWidth(400);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      fireEvent.click(screen.getByTestId('t-switcher'));
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 20, clientY: 90}));
      act(() => vi.advanceTimersByTime(500));
      expect(rename()).toBeInTheDocument();
      expect(screen.getByTestId('t-menu').style.top).toBe('90px');
    });
  });
});
