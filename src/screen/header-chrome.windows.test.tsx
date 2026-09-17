import {fireEvent, render, screen} from '@testing-library/react-native';
import {View} from 'react-native';
import {spacing} from '../theme';
import {ScreenHeader} from './header.windows';

type Measurable = {measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void};

/** The view prototype a header measures itself through, found through a view of our own so a test can spy on it. */
async function viewPrototype(): Promise<Measurable> {
  let probe: Measurable | null = null;
  await render(<View ref={(ref: unknown) => { probe = ref as Measurable; }}/>);
  return Object.getPrototypeOf(probe!) as Measurable;
}

/** The window's chrome as the store reports it, per test. */
const chrome = vi.hoisted(() => ({
  state: {extended: false, insets: {left: 0, right: 0, height: 0}},
  reportDragRegion: vi.fn(),
}));
vi.mock('../windows/chrome', () => ({
  useWindowChromeState: () => chrome.state,
  reportDragRegion: chrome.reportDragRegion,
}));

/** The header's outer row: two levels above its title text. */
function bar() {
  return screen.getByText('Drops').parent!.parent!;
}

const layout = {nativeEvent: {layout: {x: 0, y: 0, width: 1000, height: 48}}};

describe('ScreenHeader as the drag region (windows)', () => {
  beforeEach(() => {
    chrome.reportDragRegion.mockClear();
  });

  it('reports its row as the drag region, minus the caption buttons, while the content is in the title bar', async () => {
    chrome.state = {extended: true, insets: {left: 0, right: 138, height: 32}};
    await render(<ScreenHeader title="Drops" dragRegion/>);
    await fireEvent(bar(), 'layout', layout);
    expect(chrome.reportDragRegion).toHaveBeenCalledTimes(1);
    expect(chrome.reportDragRegion).toHaveBeenCalledWith(expect.anything(), {left: 0, right: 138, height: 32});
    // The row leaves the caption buttons their room.
    expect(screen.getByText('Drops').parent).toHaveStyle({paddingLeft: spacing.three, paddingRight: spacing.three + 138});
  });

  it('leaves the caption buttons their room from any header lying in the title bar\'s band, not one lower down', async () => {
    chrome.state = {extended: true, insets: {left: 0, right: 138, height: 32}};
    const measure = vi.spyOn(await viewPrototype(), 'measureInWindow').mockImplementation(callback => callback(0, 0, 1000, 48));
    await render(<ScreenHeader title="Drops"/>);
    await fireEvent(bar(), 'layout', layout);
    expect(chrome.reportDragRegion).not.toHaveBeenCalled();
    expect(screen.getByText('Drops').parent).toHaveStyle({paddingRight: spacing.three + 138});
    // A header further down the window: the caption buttons are not over it.
    measure.mockImplementation(callback => callback(0, 200, 1000, 48));
    const lower = await render(<ScreenHeader title="Lower"/>);
    await fireEvent(lower.getByText('Lower').parent!.parent!, 'layout', layout);
    expect(lower.getByText('Lower').parent).not.toHaveStyle({paddingRight: spacing.three + 138});
  });

  it('leaves the caption buttons their room on the left of a right-to-left window', async () => {
    chrome.state = {extended: true, insets: {left: 138, right: 0, height: 32}};
    await render(<ScreenHeader title="Drops" dragRegion/>);
    await fireEvent(bar(), 'layout', layout);
    expect(chrome.reportDragRegion).toHaveBeenCalledWith(expect.anything(), {left: 138, right: 0, height: 32});
    expect(screen.getByText('Drops').parent).toHaveStyle({paddingLeft: spacing.three + 138, paddingRight: spacing.three});
  });

  it('is an ordinary row for a nested stack, or while the content is not in the title bar', async () => {
    chrome.state = {extended: true, insets: {left: 0, right: 138, height: 32}};
    const nested = await render(<ScreenHeader title="Drops"/>);
    await fireEvent(bar(), 'layout', layout);
    expect(chrome.reportDragRegion).not.toHaveBeenCalled();
    nested.unmount();
    chrome.state = {extended: false, insets: {left: 0, right: 0, height: 0}};
    await render(<ScreenHeader title="Drops" dragRegion/>);
    await fireEvent(bar(), 'layout', layout);
    expect(chrome.reportDragRegion).not.toHaveBeenCalled();
  });
});
