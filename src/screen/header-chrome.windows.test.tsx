import {fireEvent, render, screen} from '@testing-library/react-native';
import {spacing} from '../theme';
import {ScreenHeader} from './header.windows';

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
    expect(chrome.reportDragRegion).toHaveBeenCalledWith(expect.anything(), 138);
    // The row leaves the caption buttons their room.
    expect(screen.getByText('Drops').parent).toHaveStyle({paddingRight: spacing.three + 138});
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
