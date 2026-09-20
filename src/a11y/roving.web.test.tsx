/**
 * The keyboard contract, pressed rather than inspected.
 *
 * axe reads the roles and says nothing about any of this, which is exactly why
 * the defect these cover shipped: `role="menu"` and `role="radiogroup"` were
 * declared for months with no arrow keys behind them.
 */
import {fireEvent, render, screen} from '@testing-library/react';
import {useRef} from 'react';
import {describe, expect, it, vi} from 'vitest';
import type {RovingFocusOptions} from './roving';
import {itemsOf, search, step, useRovingFocus, visibleText} from './roving';

/** A group of items, wired the way a real component wires one. */
function Group({labels, disabledAt = [], ...options}: {labels: string[]; disabledAt?: number[]} & RovingFocusOptions) {
  const container = useRef<HTMLDivElement>(null);
  const roving = useRovingFocus(container, options);
  return (
    <div ref={container} onKeyDown={roving.onKeyDown} data-testid="group">
      {labels.map((label, index) => (
        <button key={label} type="button" disabled={disabledAt.includes(index)} {...roving.itemProps(index)}>
          {label}
        </button>
      ))}
    </div>
  );
}

const LABELS = ['Cut', 'Copy', 'Paste', 'Delete'];

function press(key: string, init: Partial<KeyboardEvent> = {}) {
  fireEvent.keyDown(screen.getByTestId('group'), {key, ...init});
}

describe('the tab stop', () => {
  it('is one for the whole group, on the item that was named active', () => {
    render(<Group labels={LABELS} activeIndex={2}/>);
    expect(screen.getAllByRole('button').map(button => button.tabIndex)).toEqual([-1, -1, 0, -1]);
  });

  it('is the first item when none was named', () => {
    render(<Group labels={LABELS}/>);
    expect(screen.getAllByRole('button').map(button => button.tabIndex)).toEqual([0, -1, -1, -1]);
  });
});

describe('moving', () => {
  it('walks with the arrows the orientation asks for, and ignores the other pair', () => {
    render(<Group labels={LABELS}/>);
    screen.getByText('Cut').focus();
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Copy');
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Paste');
    press('ArrowUp');
    expect(document.activeElement).toHaveTextContent('Copy');
    // A vertical group leaves the horizontal arrows to whatever is around it.
    press('ArrowRight');
    expect(document.activeElement).toHaveTextContent('Copy');
  });

  it('takes Left and Right when it is laid out in a row', () => {
    render(<Group labels={LABELS} orientation="horizontal"/>);
    screen.getByText('Cut').focus();
    press('ArrowRight');
    expect(document.activeElement).toHaveTextContent('Copy');
    press('ArrowLeft');
    expect(document.activeElement).toHaveTextContent('Cut');
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Cut');
  });

  it('comes round at the ends, or stays put when it was told not to', () => {
    const {unmount} = render(<Group labels={LABELS}/>);
    screen.getByText('Cut').focus();
    press('ArrowUp');
    expect(document.activeElement).toHaveTextContent('Delete');
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Cut');
    unmount();

    render(<Group labels={LABELS} wrap={false}/>);
    screen.getByText('Cut').focus();
    press('ArrowUp');
    expect(document.activeElement).toHaveTextContent('Cut');
  });

  it('steps over what cannot be focused', () => {
    render(<Group labels={LABELS} disabledAt={[1, 2]}/>);
    screen.getByText('Cut').focus();
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Delete');
  });

  it('goes to the ends with Home and End, past anything disabled there', () => {
    render(<Group labels={LABELS} disabledAt={[0, 3]}/>);
    screen.getByText('Copy').focus();
    press('End');
    expect(document.activeElement).toHaveTextContent('Paste');
    press('Home');
    expect(document.activeElement).toHaveTextContent('Copy');
  });

  it('starts from the first item when the focus is somewhere else entirely', () => {
    render(<Group labels={LABELS}/>);
    document.body.focus();
    press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Cut');
  });

  it('says where it went, so a radio group can select as it moves', () => {
    const onMove = vi.fn();
    render(<Group labels={LABELS} onMove={onMove}/>);
    screen.getByText('Cut').focus();
    press('ArrowDown');
    expect(onMove).toHaveBeenCalledWith(1);
  });

  it('does nothing at all for a key it does not own, or a group with no items', () => {
    const onMove = vi.fn();
    const {unmount} = render(<Group labels={LABELS} onMove={onMove}/>);
    screen.getByText('Cut').focus();
    press('Tab');
    press('a');
    expect(document.activeElement).toHaveTextContent('Cut');
    expect(onMove).not.toHaveBeenCalled();
    unmount();

    render(<Group labels={[]}/>);
    press('ArrowDown');
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('typeahead', () => {
  it('jumps to the next item starting with the letter, and round again for a repeat', () => {
    render(<Group labels={LABELS} typeahead/>);
    screen.getByText('Cut').focus();
    press('c');
    expect(document.activeElement).toHaveTextContent('Copy');
    // The same letter again means the next one starting with it, not this one.
    press('c');
    expect(document.activeElement).toHaveTextContent('Cut');
  });

  it('builds a word while the typing keeps up, so `co` is not `c` then `o`', () => {
    render(<Group labels={LABELS} typeahead/>);
    screen.getByText('Cut').focus();
    press('c');
    expect(document.activeElement).toHaveTextContent('Copy');
    press('o');
    // `co` still matches Copy, which is where the focus already is: a word
    // being typed keeps looking from the item before, so it can match itself.
    expect(document.activeElement).toHaveTextContent('Copy');
  });

  it('starts a new word once the pause is long enough', () => {
    vi.useFakeTimers();
    try {
      render(<Group labels={LABELS} typeahead/>);
      screen.getByText('Cut').focus();
      press('c');
      expect(document.activeElement).toHaveTextContent('Copy');
      vi.advanceTimersByTime(700);
      press('d');
      expect(document.activeElement).toHaveTextContent('Delete');
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves the keystroke alone when nothing matches, and when a modifier is held', () => {
    render(<Group labels={LABELS} typeahead/>);
    screen.getByText('Cut').focus();
    press('z');
    expect(document.activeElement).toHaveTextContent('Cut');
    press('c', {ctrlKey: true});
    expect(document.activeElement).toHaveTextContent('Cut');
    press('c', {metaKey: true});
    expect(document.activeElement).toHaveTextContent('Cut');
    press('c', {altKey: true});
    expect(document.activeElement).toHaveTextContent('Cut');
  });

  it('will not land on something disabled', () => {
    render(<Group labels={LABELS} typeahead disabledAt={[1]}/>);
    screen.getByText('Cut').focus();
    press('c');
    expect(document.activeElement).toHaveTextContent('Cut');
  });
});

describe('the pieces on their own', () => {
  it('finds nothing under nothing', () => {
    expect(itemsOf(null)).toEqual([]);
    expect(step([], 0, 1, true)).toBe(-1);
    expect(search([], 0, 'a')).toBe(-1);
  });

  it('gives up rather than circling a group that is entirely disabled', () => {
    render(<Group labels={LABELS} disabledAt={[0, 1, 2, 3]}/>);
    const items = itemsOf(screen.getByTestId('group'));
    expect(items).toHaveLength(4);
    expect(step(items, 0, 1, true)).toBe(-1);
    expect(search(items, 0, 'c')).toBe(-1);
  });

  it('reads a name the way a screen reader does, past the glyph and into a label', () => {
    render(
      <div data-testid="named">
        <button type="button" data-roving-item="">
          <span aria-hidden="true">delete</span>Remove
        </button>
        <button type="button" aria-label="Copy to clipboard" data-roving-item="">
          <span aria-hidden="true">content_copy</span>
        </button>
      </div>,
    );
    const items = itemsOf(screen.getByTestId('named'));
    // The hidden ligature is not part of the name, so `d` finds neither.
    expect(search(items, -1, 'd')).toBe(-1);
    expect(search(items, -1, 'remove')).toBe(0);
    expect(search(items, -1, 'copy to')).toBe(1);
  });

  it('says nothing for a node that is neither text nor an element', () => {
    const container = document.createElement('div');
    container.append(document.createComment('a comment React left behind'));
    expect(visibleText(container)).toBe('');
  });

  it('counts an aria-disabled item as out of reach too', () => {
    render(
      <div data-testid="aria-group">
        <button type="button" data-roving-item="">Cut</button>
        <button type="button" aria-disabled="true" data-roving-item="">Copy</button>
        <button type="button" data-roving-item="">Paste</button>
      </div>,
    );
    const items = itemsOf(screen.getByTestId('aria-group'));
    expect(step(items, 0, 1, true)).toBe(2);
  });
});
