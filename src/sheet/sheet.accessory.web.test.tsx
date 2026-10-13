import {act, render, screen, within} from '@testing-library/react';
import {TestResizeObserver, reportSizes} from '../__tests__/resize';
import {Sheet} from '.';

// react-native-web fires `onLayout` from one `ResizeObserver` of its own,
// read from `window`, which jsdom lacks: this one keeps what it observes,
// and `layout` below reports a size to it. It is made once for the module's
// life, so the list of observers is never emptied.
Object.assign(window, {ResizeObserver: TestResizeObserver});
vi.stubGlobal('ResizeObserver', TestResizeObserver);

/** Lays elements out at widths and reports them: `UIManager.measure` reads the offset metrics, in a timeout. */
async function layout(...sizes: [Element, number][]) {
  for (const [element, width] of sizes) {
    for (const [key, value] of Object.entries({offsetWidth: width, offsetHeight: 40, offsetLeft: 0, offsetTop: 0})) {
      Object.defineProperty(element, key, {configurable: true, value});
    }
  }
  await act(async () => {
    reportSizes(sizes.map(([target, width]) => ({target, width, height: 40})));
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

/** The bar, its two ends, and the content of each, which is what reports a width. */
function parts() {
  const bar = screen.getByTestId('sheet-bar');
  const [leading, , trailing] = Array.from(bar.children) as HTMLElement[];
  return {bar, leading, trailing, leadingContent: leading.firstElementChild!, trailingContent: trailing.firstElementChild!};
}

/** The least width of each end, leading first. */
function sides() {
  const {leading, trailing} = parts();
  return [getComputedStyle(leading).minWidth, getComputedStyle(trailing).minWidth];
}

/** Whether `node` comes after `reference` in the page. */
const follows = (node: Node, reference: Node) => (reference.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

const filter = <span data-testid="filter">Filter</span>;

describe('Sheet accessory (web)', () => {
  it('keeps the accessory in a row of its own under the bar unless it is placed in the bar', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={filter} accessoryPlacement="row" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {bar} = parts();
    expect(bar.contains(screen.getByTestId('filter'))).toBe(false);
    expect(follows(screen.getByTestId('filter'), bar)).toBe(true);
  });

  it('puts the accessory placed in the bar at its leading end, after the back button, before anything is measured', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onBack={() => {}} onClose={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {leading} = parts();
    const accessory = within(leading).getByTestId('filter');
    expect(follows(accessory, within(leading).getByRole('button', {name: 'Back'}))).toBe(true);
    // Drawn once: in the bar, and in no row under it.
    expect(screen.getAllByTestId('filter')).toHaveLength(1);
  });

  it('draws the bar for an accessory placed in it alone, and none for one that draws nothing', () => {
    const {unmount} = render(
      <Sheet isPresented onDismiss={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(within(parts().leading).getByTestId('filter')).toBeInTheDocument();
    unmount();
    render(
      <Sheet isPresented onDismiss={() => {}} accessory={false} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(screen.queryByTestId('sheet-bar')).toBeNull();
  });

  it('makes both ends as wide as the wider end\'s content, so the title stays centred', async () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onBack={() => {}} onClose={() => {}} menu={[{label: 'Resolve all'}]} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(sides()).toEqual(['56px', '56px']);
    const {bar, leadingContent, trailingContent} = parts();
    await layout([bar, 600], [leadingContent, 150], [trailingContent, 60]);
    expect(sides()).toEqual(['150px', '150px']);
    // 600 less two ends of 150 leaves the title 300: the accessory stays in the bar.
    expect(within(parts().leading).getByTestId('filter')).toBeInTheDocument();
    // The wider end decides whichever end it is.
    await layout([trailingContent, 180]);
    expect(sides()).toEqual(['180px', '180px']);
  });

  it('matches the ends without an accessory too, when the trailing end holds the menu and close', async () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onBack={() => {}} onClose={() => {}} menu={[{label: 'Resolve all'}]} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {bar, leadingContent, trailingContent} = parts();
    await layout([bar, 400], [leadingContent, 30], [trailingContent, 60]);
    expect(sides()).toEqual(['60px', '60px']);
  });

  it('moves the accessory to a row of its own under a bar too narrow for it, and back once the bar widens', async () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {bar, leadingContent, trailingContent} = parts();
    await layout([bar, 300], [leadingContent, 120], [trailingContent, 30]);
    // 300 less two ends of 120 would leave the title 60, under its 96.
    expect(bar.contains(screen.getByTestId('filter'))).toBe(false);
    expect(follows(screen.getByTestId('filter'), bar)).toBe(true);
    // The leading end, empty without it, reports again: the ends narrow to the bar's side and give the title the room.
    await layout([leadingContent, 0]);
    expect(sides()).toEqual(['56px', '56px']);
    // The width the end had with the accessory still decides, so it stays in its row.
    expect(bar.contains(screen.getByTestId('filter'))).toBe(false);
    // 400 less two ends of 120 leaves 160: room again.
    await layout([bar, 400]);
    expect(within(bar).getByTestId('filter')).toBeInTheDocument();
    expect(screen.getAllByTestId('filter')).toHaveLength(1);
  });

  it('counts a subtitle as something to centre', async () => {
    render(
      <Sheet isPresented onDismiss={() => {}} subtitle="12 unresolved" accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {bar, leadingContent, trailingContent} = parts();
    await layout([bar, 300], [leadingContent, 120], [trailingContent, 0]);
    expect(bar.contains(screen.getByTestId('filter'))).toBe(false);
  });

  it('keeps the accessory in the bar whatever the widths with no title or subtitle to centre, and the ends at their own widths', async () => {
    render(
      <Sheet isPresented onDismiss={() => {}} onClose={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const {bar, leadingContent, trailingContent} = parts();
    await layout([bar, 200], [leadingContent, 180], [trailingContent, 30]);
    expect(within(bar).getByTestId('filter')).toBeInTheDocument();
    expect(sides()).toEqual(['56px', '56px']);
  });

  it('still moves the keyboard focus to the title as it opens, past the controls of an accessory in the bar', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" accessory={<button>Open</button>} accessoryPlacement="bar" testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(within(parts().leading).getByRole('button', {name: 'Open'})).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('heading', {name: 'Comments'}));
  });
});
