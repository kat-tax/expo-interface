/**
 * jsdom has no Custom Highlight API, which is the point of most of these: the
 * feature has to be absent without breaking anything, because it is absent on
 * every engine older than 2025 and in the test environment itself.
 */
import {render, screen} from '@testing-library/react';
import {useRef} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {MATCH_HIGHLIGHT, matchRange, registry, useMatchHighlight} from './highlight';

function Labels({query, labels}: {query?: string; labels: string[]}) {
  const container = useRef<HTMLDivElement>(null);
  useMatchHighlight(container, query, '.label');
  return (
    <div ref={container} data-testid="list">
      {labels.map(label => <span key={label} className="label">{label}</span>)}
    </div>
  );
}

/** A stand-in for the API jsdom does not implement. */
function installHighlightApi() {
  const set = vi.fn();
  const remove = vi.fn();
  vi.stubGlobal('CSS', {...globalThis.CSS, highlights: {set, delete: remove}});
  vi.stubGlobal('Highlight', class {
    ranges: Range[];
    constructor(...ranges: Range[]) {
      this.ranges = ranges;
    }
  });
  return {set, remove};
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('matchRange', () => {
  it('covers the first occurrence, whatever the case', () => {
    render(<span data-testid="label">Export drops</span>);
    const range = matchRange(screen.getByTestId('label'), 'DROP');
    expect(range?.toString()).toBe('drop');
    expect(range?.startOffset).toBe(7);
  });

  it('is nothing when the text does not contain it, or when there is no text at all', () => {
    render(
      <div>
        <span data-testid="label">Export drops</span>
        <span data-testid="empty"/>
        <span data-testid="nested"><b>Export</b></span>
      </div>,
    );
    expect(matchRange(screen.getByTestId('label'), 'zzz')).toBeNull();
    expect(matchRange(screen.getByTestId('empty'), 'a')).toBeNull();
    // A label is one text node; an element first is not one to search.
    expect(matchRange(screen.getByTestId('nested'), 'Export')).toBeNull();
  });
});

describe('registry', () => {
  it('is nothing where the engine has no Custom Highlight API, which includes jsdom', () => {
    expect(registry()).toBeNull();
    vi.stubGlobal('CSS', undefined);
    expect(registry()).toBeNull();
  });

  it('is the registry where there is one', () => {
    const {set} = installHighlightApi();
    expect(registry()).toEqual({set, delete: expect.any(Function)});
  });
});

describe('useMatchHighlight', () => {
  it('paints one range per matching label, under a name the stylesheet knows', () => {
    const {set} = installHighlightApi();
    render(<Labels query="dro" labels={['Export drops', 'Export files', 'Drop a file']}/>);
    expect(set).toHaveBeenCalledWith(MATCH_HIGHLIGHT, expect.anything());
    const [, highlight] = set.mock.calls.at(-1)!;
    // Both labels containing it, and not the one that does not.
    expect((highlight as {ranges: Range[]}).ranges.map(range => range.toString())).toEqual(['dro', 'Dro']);
  });

  it('clears the highlight when the query goes away', () => {
    const {remove} = installHighlightApi();
    const {rerender} = render(<Labels query="dro" labels={['Export drops']}/>);
    rerender(<Labels query="" labels={['Export drops']}/>);
    expect(remove).toHaveBeenCalledWith(MATCH_HIGHLIGHT);
  });

  it('paints nothing for an empty query, a blank one, or a query nothing matches', () => {
    const {set} = installHighlightApi();
    render(<Labels labels={['Export drops']}/>);
    render(<Labels query="   " labels={['Export drops']}/>);
    render(<Labels query="zzz" labels={['Export drops']}/>);
    expect(set).not.toHaveBeenCalled();
  });

  it('does nothing at all where the API is absent, rather than throwing', () => {
    expect(() => render(<Labels query="dro" labels={['Export drops']}/>)).not.toThrow();
    expect(screen.getByText('Export drops')).toBeInTheDocument();
  });

  it('does nothing before the container exists', () => {
    const {set} = installHighlightApi();
    function Detached() {
      const container = useRef<HTMLDivElement>(null);
      useMatchHighlight(container, 'dro', '.label');
      return null;
    }
    render(<Detached/>);
    expect(set).not.toHaveBeenCalled();
  });
});
