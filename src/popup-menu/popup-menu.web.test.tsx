import '@testing-library/jest-dom/vitest';
import type {MenuItem} from '../menu/types';
import {render, screen} from '@testing-library/react';
import {PopupMenu} from '.';

const items: MenuItem[] = [
  {label: 'Heading'},
  {label: 'Bullet list'},
  {label: 'Delete block', role: 'destructive', separator: true},
];

type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
  showPopover?: () => void;
  hidePopover?: () => void;
};
const proto = HTMLElement.prototype as PopoverElement;
const showPopover = vi.fn();
const hidePopover = vi.fn();
let open = false;

// jsdom ships no imperative Popover API; stub it, and report the state
// through `:popover-open` the way the browser would.
describe('PopupMenu (web)', () => {
  beforeAll(() => {
    proto.showPopover = () => {
      open = true;
      showPopover();
    };
    proto.hidePopover = () => {
      open = false;
      hidePopover();
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

  it('stays closed and takes no room until it is opened at a point', () => {
    render(<PopupMenu items={items} at={null} testID="popup"/>);
    const anchor = screen.getByTestId('popup');
    expect(anchor).toHaveClass('ui-popup-menu');
    expect(anchor.style.left).toBe('0px');
    expect(showPopover).not.toHaveBeenCalled();
    expect(screen.getAllByRole('menuitem', {hidden: true})).toHaveLength(3);
  });

  it('opens the popup at the point and anchors it there', () => {
    const {rerender} = render(<PopupMenu items={items} at={null} testID="popup"/>);
    rerender(<PopupMenu items={items} at={{x: 120, y: 48}} testID="popup"/>);
    const anchor = screen.getByTestId('popup');
    expect(anchor.style.left).toBe('120px');
    expect(anchor.style.top).toBe('48px');
    expect(anchor.style.getPropertyValue('anchor-name')).toBeTruthy();
    expect(showPopover).toHaveBeenCalledTimes(1);
    const menu = screen.getByRole('menu', {hidden: true});
    expect(menu).toHaveClass('ui-menu__list--point');
    expect(menu.style.getPropertyValue('position-anchor')).toBe(anchor.style.getPropertyValue('anchor-name'));
  });

  it('closes the popup when the point is cleared', () => {
    const {rerender} = render(<PopupMenu items={items} at={{x: 10, y: 10}} testID="popup"/>);
    expect(showPopover).toHaveBeenCalledTimes(1);
    rerender(<PopupMenu items={items} at={null} testID="popup"/>);
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('reports the dismissal when the browser closes the popup', () => {
    const onDismiss = vi.fn();
    render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', {value: 'closed'});
    menu.dispatchEvent(event);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('says nothing when the browser opens the popup', () => {
    const onDismiss = vi.fn();
    render(<PopupMenu items={items} at={{x: 10, y: 10}} onDismiss={onDismiss}/>);
    const menu = screen.getByRole('menu', {hidden: true});
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', {value: 'open'});
    menu.dispatchEvent(event);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('keeps only the entries matching the filter', () => {
    render(<PopupMenu items={items} at={{x: 0, y: 0}} filter="  LIST "/>);
    expect(screen.getAllByRole('menuitem', {hidden: true}).map(e => e.textContent)).toEqual(['Bullet list']);
  });
});
