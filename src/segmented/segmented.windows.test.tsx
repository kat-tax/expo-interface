import {render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import {SegmentedControl} from '.';

const BAR = 'ExpoInterfaceSelectorBar';

// Segments are direct children: the control reads them as `Item` elements.
const segments = [
  <SegmentedControl.Item key="day" label="Day" value="day"/>,
  <SegmentedControl.Item key="week" label="Week" value="week"/>,
  <SegmentedControl.Item key="month" label="Month" value="month"/>,
];

describe('SegmentedControl (windows)', () => {
  it('renders the SelectorBar island with the segment labels and the selected index', async () => {
    await render(<SegmentedControl label="Range" selectedValue="week" onValueChange={vi.fn()} testID="range">{segments}</SegmentedControl>);
    const bar = island(BAR);
    expect(screen.getByTestId('range').queryAll(node => node === bar)).toHaveLength(1);
    expect(JSON.parse(bar.props.options)).toEqual(['Day', 'Week', 'Month']);
    expect(bar.props.selectedIndex).toBe(1);
    expect(bar.props.label).toBe('Range');
  });

  it('falls back to the first segment for a value that is not one', async () => {
    await render(<SegmentedControl selectedValue="year" onValueChange={vi.fn()}>{segments}</SegmentedControl>);
    expect(island(BAR).props.selectedIndex).toBe(0);
  });

  it('reports the picked value and ignores an index outside the segments', async () => {
    const onValueChange = vi.fn();
    await render(<SegmentedControl selectedValue="day" onValueChange={onValueChange}>{segments}</SegmentedControl>);
    await fireIsland(island(BAR), 'selectionChange', {index: 2});
    await fireIsland(island(BAR), 'selectionChange', {index: 5});
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('month');
  });

  it('colors the indicator with accentColor, disables and dims the label', async () => {
    await render(<SegmentedControl label="Range" disabled accentColor="#FF9500">{segments}</SegmentedControl>);
    expect(island(BAR).props.accentColor).toBe('#FF9500');
    expect(island(BAR).props.disabled).toBe(true);
    expect(screen.getByText('Range')).toHaveStyle({opacity: 0.4});
  });
});
