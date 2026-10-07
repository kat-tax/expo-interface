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
});
