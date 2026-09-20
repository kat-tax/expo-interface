// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {Pager} from '.';

const WIDTH = 300;

/**
 * jsdom lays nothing out and has no scrolling, so the track is given the width
 * a page would have and a `scrollTo` that records where it was sent.
 */
function track(): HTMLElement {
  const element = screen.getByRole('group');
  Object.defineProperty(element, 'clientWidth', {value: WIDTH, configurable: true});
  return element;
}

function pages() {
  return screen.getAllByRole('tabpanel', {hidden: true});
}

beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
});

describe('Pager (web)', () => {
  it('is a carousel of tab panels with a tab list for its dots', () => {
    render(
      <Pager page={0} onPageChange={() => {}} label="Tour" testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    const carousel = screen.getByRole('group');
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(carousel).toHaveAccessibleName('Tour');
    // A region that scrolls has to be reachable from the keyboard.
    expect(carousel).toHaveAttribute('tabindex', '0');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAccessibleName('Page 1 of 2');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    // Each dot names and controls its own page, which is what makes the
    // tab roles true rather than decorative.
    expect(tabs[0]).toHaveAttribute('aria-controls', pages()[0]!.id);
    expect(pages()[0]).toHaveAttribute('aria-labelledby', tabs[0]!.id);
  });

  it('makes every page but the one on screen inert', () => {
    const view = render(
      <Pager page={0} onPageChange={() => {}} testID="p">
        <p>First</p>
        <p><button type="button">Act</button></p>
      </Pager>,
    );
    expect(pages()[0]).not.toHaveAttribute('inert');
    expect(pages()[1]).toHaveAttribute('inert');
    view.rerender(
      <Pager page={1} onPageChange={() => {}} testID="p">
        <p>First</p>
        <p><button type="button">Act</button></p>
      </Pager>,
    );
    expect(pages()[0]).toHaveAttribute('inert');
    expect(pages()[1]).not.toHaveAttribute('inert');
  });

  it('holds one tab stop and moves the page with the arrow keys', () => {
    const onPageChange = vi.fn();
    render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    tabs[0]!.focus();
    fireEvent.keyDown(screen.getByRole('tablist'), {key: 'ArrowRight'});
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('takes a click on a dot as a request for that page', () => {
    const onPageChange = vi.fn();
    render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    fireEvent.click(screen.getAllByRole('tab')[1]!);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('scrolls to the page it is given, leaving the manner of it to CSS', () => {
    const view = render(
      <Pager page={0} onPageChange={() => {}} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    track();
    view.rerender(
      <Pager page={1} onPageChange={() => {}} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    // No `behavior`: the stylesheet decides, so reduced motion is honoured
    // without the kit asking about it.
    expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({left: WIDTH});
  });

  it('reports the page a scroll settles on, and says nothing when it has not moved', () => {
    const onPageChange = vi.fn();
    render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    const element = track();
    element.scrollLeft = WIDTH;
    fireEvent(element, new Event('scrollend'));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
    // Coming to rest where the pager already is says nothing new — which is
    // also what keeps an animated scroll from being interrupted by its own
    // arrival.
    element.scrollLeft = 0;
    fireEvent(element, new Event('scrollend'));
    expect(onPageChange).toHaveBeenCalledOnce();
  });

  it('draws no dots when it was told not to, or when there is one page', () => {
    render(
      <Pager page={0} onPageChange={() => {}} indicator={false} testID="p">
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByTestId('p-dots')).toBeNull();

    render(
      <Pager page={0} onPageChange={() => {}}>
        <p>Only</p>
      </Pager>,
    );
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('works without a testID, which is what an app usually gives it', () => {
    render(
      <Pager page={0} onPageChange={() => {}}>
        <p>First</p>
        <p>Second</p>
      </Pager>,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')[0]).toHaveAccessibleName('Page 1 of 2');
  });
});
