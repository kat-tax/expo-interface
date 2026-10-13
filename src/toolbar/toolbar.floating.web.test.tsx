import {act, fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {AccentProvider} from '../accent';
import {Toolbar} from '.';

/**
 * react-native-web fires `onLayout` from one `ResizeObserver`, made with the
 * first view that has a handler, and observes a view from its mount. jsdom
 * has no observer, so this one lets a test report a size.
 */
let report: ((entries: {target: Element}[]) => void) | undefined;
class ResizeObserverStub {
  constructor(callback: typeof report) {
    report = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
// react-native-web reads the constructor from `window`, not `globalThis`.
Object.assign(window, {ResizeObserver: ResizeObserverStub});
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

/** Lays a view out at a size: `UIManager.measure` reads the offset metrics in a timeout. */
const layout = async (element: Element, width: number, height: number) => {
  for (const [key, value] of Object.entries({offsetWidth: width, offsetHeight: height, offsetLeft: 0, offsetTop: 0})) {
    Object.defineProperty(element, key, {configurable: true, value});
  }
  await act(async () => {
    report?.([{target: element}]);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

const commands = [
  {label: 'Bold', icon: icons.add, hideLabel: true, active: true},
  {label: 'Link', icon: icons.share, hideLabel: true, active: false},
  {label: 'Clear', icon: icons.trash, hideLabel: true},
];

describe('Toolbar floating (web)', () => {
  it('draws its toggles as pressed buttons in a raised capsule', () => {
    render(<Toolbar floating commands={commands} testID="bar"/>);
    expect(screen.getByRole('button', {name: 'Bold'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: 'Link'})).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', {name: 'Clear'})).not.toHaveAttribute('aria-pressed');
    const bar = screen.getByTestId('bar');
    expect(getComputedStyle(bar).borderTopLeftRadius).toBe('999px');
    expect(getComputedStyle(bar).boxShadow).not.toBe('');
  });

  it('floats on a material of its own, or the app\'s, beside a rectangle too, and an edge bar keeps its fill', () => {
    const bar = () => screen.getByTestId('bar');
    const {rerender} = render(<Toolbar floating commands={commands} material="regular" testID="bar"/>);
    expect(bar().dataset).toMatchObject({material: 'regular', materialFill: 'element', materialEdge: 'float'});
    expect(getComputedStyle(bar()).boxShadow).toBe('');
    expect(getComputedStyle(bar()).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    rerender(
      <AccentProvider overlayMaterial="thin">
        <Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>
      </AccentProvider>,
    );
    expect(bar().dataset.material).toBe('thin');
    rerender(
      <AccentProvider overlayMaterial="thin">
        <Toolbar commands={commands} testID="bar"/>
      </AccentProvider>,
    );
    expect(bar().dataset.material).toBeUndefined();
    expect(getComputedStyle(bar()).backgroundColor).toBe('var(--color-background)');
    rerender(<Toolbar floating commands={commands} testID="bar"/>);
    expect(bar().dataset.material).toBeUndefined();
    expect(getComputedStyle(bar()).backgroundColor).toBe('var(--color-background-element)');
  });

  it('floats beside a rectangle once placed, and takes no presses before', () => {
    render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>);
    const bounds = screen.getByTestId('bar-bounds');
    // react-native-web writes box-none as none on the box and auto on what is in it.
    expect(getComputedStyle(bounds).pointerEvents).toBe('none');
    const placed = bounds.firstElementChild as HTMLElement;
    expect(getComputedStyle(placed).opacity).toBe('0');
    expect(placed.contains(screen.getByRole('button', {name: 'Bold'}))).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'Bold'}));
  });
});

/**
 * A bar at a rectangle folds the trailing commands that do not fit the room
 * between its parent's edges, less the insets and the gap, behind More: one
 * per layout, each in a view of its own, until it fits.
 */
describe('Toolbar at a rectangle folds (web)', () => {
  const tools = [
    {label: 'Bold', icon: icons.add, hideLabel: true},
    {label: 'Italic', icon: icons.star, hideLabel: true},
    {label: 'Link', icon: icons.share, hideLabel: true, separator: true},
    {label: 'Export', secondary: true},
  ];
  const card = () => screen.getByTestId('bar-bounds').firstElementChild as HTMLElement;
  const onBar = (name: string) => screen.queryByRole('button', {name}) !== null;
  /** The overflow menu's entries, in order. */
  const entries = () => screen.queryAllByRole('menuitem', {hidden: true}).map(item => item.querySelector('.ui-menu__label')!.textContent);
  const at = {x: 100, y: 200, width: 80, height: 20};

  it('folds the trailing commands that do not fit the room behind More, first among its entries, until the bar fits', async () => {
    render(<Toolbar at={at} commands={tools} testID="bar"/>);
    // The room: 200 less 8 at each side.
    await layout(screen.getByTestId('bar-bounds'), 200, 600);
    await layout(card(), 240, 44);
    // Link is behind More, before the secondary Export; the bar is not drawn until it fits.
    expect(onBar('Link')).toBe(false);
    expect(onBar('Italic')).toBe(true);
    expect(entries()).toEqual(['Link', 'Export']);
    expect(getComputedStyle(card()).opacity).toBe('0');
    // The first fold swapped Link for More and the width stayed: the next takes Italic.
    await layout(card(), 240, 44);
    expect(onBar('Italic')).toBe(false);
    expect(onBar('Bold')).toBe(true);
    expect(entries()).toEqual(['Italic', 'Link', 'Export']);
    expect(getComputedStyle(card()).opacity).toBe('0');
    // Fits: drawn, kept inside the parent by its own width, 200 - 8 - 170.
    await layout(card(), 170, 44);
    expect(getComputedStyle(card()).opacity).not.toBe('0');
    expect(card().style.left).toBe('22px');
  });

  it('keeps the fold as the rectangle moves, unfolds with more room, and draws every command when the bar fits', async () => {
    const {rerender} = render(<Toolbar at={at} commands={tools} testID="bar"/>);
    await layout(screen.getByTestId('bar-bounds'), 200, 600);
    await layout(card(), 240, 44);
    await layout(card(), 240, 44);
    await layout(card(), 170, 44);
    rerender(<Toolbar at={{...at, x: 20}} commands={tools} testID="bar"/>);
    expect(onBar('Italic')).toBe(false);
    expect(getComputedStyle(card()).opacity).not.toBe('0');
    expect(card().style.left).toBe('8px');
    // More room: every command comes back, and the bar waits for its layout.
    await layout(screen.getByTestId('bar-bounds'), 400, 600);
    expect(onBar('Italic')).toBe(true);
    expect(onBar('Link')).toBe(true);
    expect(getComputedStyle(card()).opacity).toBe('0');
    await layout(card(), 240, 44);
    expect(getComputedStyle(card()).opacity).not.toBe('0');
    expect(entries()).toEqual(['Export']);
  });
});
