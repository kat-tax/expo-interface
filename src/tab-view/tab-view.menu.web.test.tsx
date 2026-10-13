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
    const onSelect = vi.fn();

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('arms at half a second, as the web ContextMenu does, and opens the menu in a task after the release\'s click, which selects nothing', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      // Armed, not open: a menu shown while the touch is down is dismissed by
      // the release, and the release's click would select the tab under it.
      expect(rename()).toBeNull();
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(notes)).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
      expect(rename()).toBeNull();
      act(() => vi.advanceTimersByTime(0));
      expect(rename()).toBeInTheDocument();
      const anchor = screen.getByTestId('t-menu');
      expect(anchor.style.left).toBe('140px');
      expect(anchor.style.top).toBe('30px');
      // The grace after the release does not open it again.
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getAllByRole('menuitem', {name: 'Rename', hidden: true})).toHaveLength(1);
    });

    it('opens the menu a grace after a release no click follows, and swallows a click that comes late', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      act(() => vi.advanceTimersByTime(299));
      expect(rename()).toBeNull();
      act(() => vi.advanceTimersByTime(1));
      expect(rename()).toBeInTheDocument();
      expect(fireEvent.click(notes)).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
      // The next touch is a new gesture: a short one selects.
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(notes)).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('a');
    });

    it('opens nothing for a touch the browser cancels once armed', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(notes, pointerEvent('pointercancel', 'touch'));
      act(() => vi.advanceTimersByTime(1000));
      expect(rename()).toBeNull();
    });

    it('leaves a short touch to its click, which selects, and opens nothing for a touch lifted, moved or cancelled before the hold, nor for a mouse', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(499));
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(notes)).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('a');
      act(() => vi.advanceTimersByTime(1000));
      expect(rename()).toBeNull();
      for (const end of ['pointerup', 'pointermove', 'pointercancel']) {
        fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
        fireEvent(notes, pointerEvent(end, 'touch'));
        act(() => vi.advanceTimersByTime(1000));
        expect(rename()).toBeNull();
      }
      // A mouse has the right click, and its lift has no hold to end.
      fireEvent(notes, pointerEvent('pointerdown', 'mouse', {clientX: 140, clientY: 30}));
      fireEvent(notes, pointerEvent('pointerup', 'mouse'));
      act(() => vi.advanceTimersByTime(1000));
      expect(rename()).toBeNull();
    });

    it('opens the menu once where the browser raises contextmenu for the held touch as well', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
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
      // And with the hold already armed: the `contextmenu` disarms it, so the
      // release opens nothing more.
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent.contextMenu(notes, {clientX: 142, clientY: 32});
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      act(() => vi.advanceTimersByTime(300));
      expect(anchor.style.left).toBe('142px');
      expect(screen.getAllByRole('menuitem', {name: 'Rename', hidden: true})).toHaveLength(1);
    });

    it('leaves a tab without a menu alone', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [, sketch] = screen.getAllByRole('tab');
      fireEvent(sketch, pointerEvent('pointerdown', 'touch', {clientX: 300, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(sketch, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(sketch)).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('b');
      act(() => vi.advanceTimersByTime(300));
      expect(screen.queryByRole('menuitem', {hidden: true})).toBeNull();
    });

    it('forgets a touch still held, or a menu still to come, when the view goes', () => {
      const first = render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      fireEvent(screen.getAllByRole('tab')[0]!, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      first.unmount();
      expect(() => act(() => vi.advanceTimersByTime(500))).not.toThrow();
      const second = render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 140, clientY: 30}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      second.unmount();
      expect(() => act(() => vi.advanceTimersByTime(300))).not.toThrow();
    });

    it('opens a card\'s menu after the touch lifts too, and the click neither selects nor puts the cards away', () => {
      windowWidth(400);
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      fireEvent.click(screen.getByTestId('t-switcher'));
      const [notes] = screen.getAllByRole('tab');
      fireEvent(notes, pointerEvent('pointerdown', 'touch', {clientX: 20, clientY: 90}));
      act(() => vi.advanceTimersByTime(500));
      fireEvent(notes, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(notes)).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId('t-cards')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(0));
      expect(rename()).toBeInTheDocument();
      expect(screen.getByTestId('t-menu').style.top).toBe('90px');
    });
  });
});
