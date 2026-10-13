// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {HELD_GRACE_MS, LONG_PRESS_MS, useHeldTouch} from './held';

/** A pointer event with a `pointerType`; jsdom has no `PointerEvent` constructor. */
function pointerEvent(type: string, pointerType: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true, ...init});
  Object.defineProperty(event, 'pointerType', {value: pointerType});
  return event;
}

const onHeld = vi.fn();
const onClick = vi.fn();
const onEntry = vi.fn();

/**
 * An element a touch can be held on, with a popover of its own inside it as
 * the `ContextMenu` has, and a button beside it that forgets the hold as a
 * `contextmenu` does.
 */
function Held({enabled}: {enabled?: boolean}) {
  const held = useHeldTouch<string>(onHeld, enabled);
  return (
    <>
      <div data-testid="el" onClick={onClick} {...held.handlers('tab')}>
        <span data-testid="text">text</span>
        <div popover="auto">
          <button type="button" data-testid="entry" onClick={onEntry}>entry</button>
        </div>
      </div>
      <button type="button" data-testid="cancel" onClick={held.cancel}>cancel</button>
    </>
  );
}

const el = () => screen.getByTestId('el');
const down = (target: HTMLElement, pointerType = 'touch', x = 10, y = 20) =>
  fireEvent(target, pointerEvent('pointerdown', pointerType, {clientX: x, clientY: y}));
const up = (target: HTMLElement, pointerType = 'touch') => fireEvent(target, pointerEvent('pointerup', pointerType));
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useHeldTouch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('arms at the hold, takes the release\'s click and opens in a task after it', () => {
    render(<Held/>);
    down(el());
    wait(LONG_PRESS_MS - 1);
    up(el());
    // Lifted a moment too soon: the click is the element's.
    expect(fireEvent.click(screen.getByTestId('text'))).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();

    down(el());
    wait(LONG_PRESS_MS);
    // Armed, not open: the menu waits for the release.
    expect(onHeld).not.toHaveBeenCalled();
    up(el());
    expect(fireEvent.click(screen.getByTestId('text'))).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onHeld).not.toHaveBeenCalled();
    wait(0);
    expect(onHeld).toHaveBeenCalledTimes(1);
    expect(onHeld).toHaveBeenCalledWith(10, 20, 'tab');
    // The grace does not open it a second time, and the arm is spent.
    wait(HELD_GRACE_MS);
    expect(onHeld).toHaveBeenCalledTimes(1);
    expect(fireEvent.click(el())).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('opens a grace after a release no click follows, swallows a click that comes late, and forgets the arm at the next press', () => {
    render(<Held/>);
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    wait(HELD_GRACE_MS - 1);
    expect(onHeld).not.toHaveBeenCalled();
    wait(1);
    expect(onHeld).toHaveBeenCalledTimes(1);
    expect(fireEvent.click(el())).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    wait(10);
    expect(onHeld).toHaveBeenCalledTimes(1);
    // The next touch is a new gesture: a short one, whose click is the element's.
    down(el());
    up(el());
    expect(fireEvent.click(el())).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
    wait(HELD_GRACE_MS);
    expect(onHeld).toHaveBeenCalledTimes(1);
  });

  it('opens nothing for a touch the browser cancels, before or after the hold', () => {
    render(<Held/>);
    down(el());
    wait(LONG_PRESS_MS);
    fireEvent(el(), pointerEvent('pointercancel', 'touch'));
    wait(1000);
    expect(onHeld).not.toHaveBeenCalled();
    expect(fireEvent.click(el())).toBe(true);
    down(el());
    wait(100);
    fireEvent(el(), pointerEvent('pointercancel', 'touch'));
    wait(1000);
    expect(onHeld).not.toHaveBeenCalled();
  });

  it('ends the hold at a move before it, and keeps the arm through a drift after it', () => {
    render(<Held/>);
    down(el());
    fireEvent(el(), pointerEvent('pointermove', 'touch'));
    wait(LONG_PRESS_MS);
    up(el());
    expect(fireEvent.click(el())).toBe(true);
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
    down(el());
    wait(LONG_PRESS_MS);
    fireEvent(el(), pointerEvent('pointermove', 'touch'));
    up(el());
    expect(fireEvent.click(el())).toBe(false);
    wait(0);
    expect(onHeld).toHaveBeenCalledTimes(1);
  });

  it('ignores a mouse, whose press clears a standing arm', () => {
    render(<Held/>);
    down(el(), 'mouse');
    wait(LONG_PRESS_MS);
    up(el(), 'mouse');
    expect(fireEvent.click(el())).toBe(true);
    expect(onHeld).not.toHaveBeenCalled();
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    wait(HELD_GRACE_MS);
    expect(onHeld).toHaveBeenCalledTimes(1);
    down(el(), 'mouse');
    up(el(), 'mouse');
    expect(fireEvent.click(el())).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('holds nothing while not enabled', () => {
    render(<Held enabled={false}/>);
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    expect(fireEvent.click(el())).toBe(true);
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
  });

  it('leaves a press, and a click, inside a popover of the element\'s own to the popover', () => {
    render(<Held/>);
    const entry = screen.getByTestId('entry');
    down(entry);
    wait(LONG_PRESS_MS);
    up(entry);
    expect(fireEvent.click(entry)).toBe(true);
    expect(onEntry).toHaveBeenCalledTimes(1);
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
    // The menu up from a grace, the arm standing: a pick in it is not swallowed.
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    wait(HELD_GRACE_MS);
    expect(onHeld).toHaveBeenCalledTimes(1);
    expect(fireEvent.click(entry)).toBe(true);
    expect(onEntry).toHaveBeenCalledTimes(2);
  });

  it('holds on an element inside a popover, which is not the element\'s own', () => {
    render(<div popover="auto"><Held/></div>);
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    expect(fireEvent.click(el())).toBe(false);
    wait(0);
    expect(onHeld).toHaveBeenCalledTimes(1);
  });

  it('forgets a hold or an arm when asked, as a contextmenu that opens the menu itself asks', () => {
    render(<Held/>);
    down(el());
    wait(100);
    fireEvent.click(screen.getByTestId('cancel'));
    wait(LONG_PRESS_MS);
    up(el());
    expect(fireEvent.click(el())).toBe(true);
    down(el());
    wait(LONG_PRESS_MS);
    fireEvent.click(screen.getByTestId('cancel'));
    up(el());
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
    expect(fireEvent.click(el())).toBe(true);
  });

  it('forgets a touch still held, or a menu still to come, when the element goes', () => {
    const first = render(<Held/>);
    down(el());
    wait(LONG_PRESS_MS);
    up(el());
    first.unmount();
    wait(HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
    const second = render(<Held/>);
    down(el());
    second.unmount();
    wait(LONG_PRESS_MS + HELD_GRACE_MS);
    expect(onHeld).not.toHaveBeenCalled();
  });
});
