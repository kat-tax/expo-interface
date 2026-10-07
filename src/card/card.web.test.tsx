import {act, fireEvent, render, screen} from '@testing-library/react';
import {Card} from '.';

/** A `matchMedia` that answers `(hover: hover)` as asked, and hands out its change listener. */
function pointer(hovers: boolean) {
  const add = vi.fn();
  const remove = vi.fn();
  vi.stubGlobal('matchMedia', vi.fn(() => ({matches: hovers, addEventListener: add, removeEventListener: remove})));
  return {add, remove};
}

const star = () => screen.getByRole('button', {name: 'Favorite', hidden: true});
const hidden = () => star().classList.contains('ui-icon-toggle--hidden');

describe('Card (web)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a button whose text starts at the leading edge, as a box\'s does', () => {
    render(<Card title="Holiday photos" subtitle="Edited yesterday" onPress={() => {}} testID="card"/>);
    const card = screen.getByRole('button', {name: 'Holiday photos, Edited yesterday'});
    expect(card.tagName).toBe('BUTTON');
    const style = getComputedStyle(card);
    // react-native-web resolves `start` to the writing direction's own side.
    expect(['left', 'start']).toContain(style.textAlign);
    expect(style.cursor).toBe('pointer');
  });

  it('reveals the off star under a pointer that hovers, and keeps it while the keyboard is in the card', () => {
    pointer(true);
    render(<Card favorite={{value: false, onValueChange: () => {}}} title="Holiday photos" onPress={() => {}} testID="card"/>);
    const card = screen.getByTestId('card');
    const box = card.parentElement!;
    expect(hidden()).toBe(true);
    fireEvent.pointerOver(card);
    expect(hidden()).toBe(false);
    fireEvent.pointerOut(card);
    expect(hidden()).toBe(true);
    // The keyboard: focus on the card shows the star, and tabbing from the
    // card to the star keeps it, since the focus is still in the box.
    fireEvent.focusIn(card);
    expect(hidden()).toBe(false);
    fireEvent.focusOut(card, {relatedTarget: star()});
    expect(hidden()).toBe(false);
    fireEvent.focusOut(star(), {relatedTarget: document.body});
    expect(hidden()).toBe(true);
    fireEvent.focusIn(box);
    fireEvent.focusOut(box, {relatedTarget: null});
    expect(hidden()).toBe(true);
  });

  it('keeps a star that is set, and shows the off star always where nothing hovers', () => {
    pointer(true);
    const {unmount} = render(<Card favorite={{value: true, onValueChange: () => {}}} testID="card"/>);
    expect(hidden()).toBe(false);
    expect(star()).toHaveAttribute('aria-pressed', 'true');
    unmount();
    pointer(false);
    render(<Card favorite={{value: false, onValueChange: () => {}}} testID="card"/>);
    expect(hidden()).toBe(false);
  });

  it('shows the off star where the browser cannot say, and follows the pointer changing', () => {
    const first = render(<Card favorite={{value: false, onValueChange: () => {}}} testID="card"/>);
    expect(hidden()).toBe(false);
    first.unmount();
    const {add, remove} = pointer(false);
    const {unmount} = render(<Card favorite={{value: false, onValueChange: () => {}}} testID="card"/>);
    expect(hidden()).toBe(false);
    expect(add).toHaveBeenCalledWith('change', expect.any(Function));
    // A mouse arrives: the query flips, the listener fires, the star hides.
    vi.stubGlobal('matchMedia', vi.fn(() => ({matches: true, addEventListener: add, removeEventListener: remove})));
    act(() => {
      add.mock.calls[0][1]();
    });
    expect(hidden()).toBe(true);
    unmount();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('draws the menu as a popover menu beside the title', () => {
    render(<Card title="Holiday photos" menu={[{label: 'Rename'}, {label: 'Delete', role: 'destructive'}]} onPress={() => {}} testID="card"/>);
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
    expect(screen.getByRole('menuitem', {name: 'Rename', hidden: true})).toBeInTheDocument();
    expect(screen.getByTestId('card-overlay')).toBeInTheDocument();
  });
});
