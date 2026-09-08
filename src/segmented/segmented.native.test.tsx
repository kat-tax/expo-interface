import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes, type HostNode} from '../__tests__/native';
import {SegmentedControl} from '.';

const isIOS = Platform.OS === 'ios';
const light = colors.light;

const items = [
  <SegmentedControl.Item key="day" label="Day" value="day"/>,
  <SegmentedControl.Item key="week" label="Week" value="week"/>,
  <SegmentedControl.Item key="month" label="Month" value="month"/>,
];

/** The Compose `Box` whose `Text` child renders `label` (Android only). */
function segment(label: string): HostNode {
  const match = nodes().find(n => modifier(n.props, 'selectable') && nodes(n).some(c => c.props?.text === label));
  if (!match) throw new Error(`No segment labelled ${label}`);
  return match;
}

/** The segment's own state, read off the modifiers Compose is handed. */
function state(label: string) {
  const {props} = segment(label);
  return {
    selected: modifier(props, 'selectable')?.selected as boolean,
    fill: modifier(props, 'background')?.color as string | undefined,
    radius: modifier(props, 'clip')?.shape?.radius as number,
    height: modifier(props, 'height')?.height as number,
  };
}

/** The track `Row` wrapping the segments (Android only). */
const track = () => host(p => modifier(p, 'selectableGroup') !== undefined);

/** Press a segment the way Compose does: a global event routed to `selectable`. */
async function press(label: string) {
  const {props} = segment(label);
  await act(async () => {
    props.onGlobalEvent({nativeEvent: {payload: ['selectable', {}]}});
  });
}

/** SwiftUI picker options as `[text, tag]` pairs (iOS only). */
const tags = () => nodes().filter(n => modifier(n.props, 'tag')).map(n => [n.props.text, modifier(n.props, 'tag')?.tag]);

describe(`SegmentedControl (${Platform.OS})`, () => {
  it('renders the native segmented control with its label and items', async () => {
    await render(
      <SegmentedControl label="Range" selectedValue="week" onValueChange={vi.fn()} testID="sg">{items}</SegmentedControl>,
    );
    if (isIOS) {
      const {props} = screen.getByTestId('sg');
      expect(props.label).toBe('Range');
      expect(props.selection).toBe('week');
      expect(modifier(props, 'pickerStyle')).toEqual({$type: 'pickerStyle', style: 'segmented'});
      expect(modifier(props, 'tint')).toBeUndefined();
      expect(modifier(props, 'disabled')).toBeUndefined();
      expect(tags()).toEqual([['Day', 'day'], ['Week', 'week'], ['Month', 'month']]);
    } else {
      const row = byComposeTestID('sg');
      expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
      expect(row.props.horizontalArrangement).toBe('spaceBetween');
      expect(host(p => p.text === 'Range').props.color).toBe(light.label);
      expect(state('Day').selected).toBe(false);
      expect(state('Week').selected).toBe(true);
      expect(state('Month').selected).toBe(false);
    }
  });

  it('seeds an uncontrolled control with the first item', async () => {
    await render(<SegmentedControl testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      expect(screen.getByTestId('sg').props.selection).toBe('day');
    } else {
      expect(state('Day').selected).toBe(true);
      expect(state('Week').selected).toBe(false);
    }
  });

  it('keeps numeric values typed', async () => {
    await render(
      <SegmentedControl selectedValue={2} testID="sg">
        <SegmentedControl.Item label="One" value={1}/>
        <SegmentedControl.Item label="Two" value={2}/>
      </SegmentedControl>,
    );
    if (isIOS) {
      expect(screen.getByTestId('sg').props.selection).toBe(2);
      expect(tags()).toEqual([['One', 1], ['Two', 2]]);
    } else {
      expect(state('Two').selected).toBe(true);
    }
  });

  it('raises only the selected segment, on the neutral track', async () => {
    await render(<SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      // The system control paints its own indicator; no fill modifier is emitted.
      expect(modifier(screen.getByTestId('sg').props, 'tint')).toBeUndefined();
    } else {
      expect(modifier(track().props, 'background')?.color).toBe(light.pillBackground);
      expect(state('Day').fill).toBe(light.segmentSelected);
      expect(state('Week').fill).toBeUndefined();
      expect(host(p => p.text === 'Day').props.color).toBe(light.label);
      // The raised segment casts the same soft shadow the iOS indicator does.
      expect(modifier(segment('Day').props, 'dropShadow')).toBeDefined();
      expect(modifier(segment('Week').props, 'dropShadow')).toBeUndefined();
    }
  });

  it('leaves the fill neutral under a custom accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>
      </AccentProvider>,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'tint')).toBeUndefined();
    } else {
      // The accent seed tints buttons and switches, not the raised segment.
      expect(state('Day').fill).toBe(light.segmentSelected);
    }
  });

  it('applies an explicit accentColor as the selected fill', async () => {
    await render(
      <SegmentedControl selectedValue="day" accentColor="#FFCC00" testID="sg">{items}</SegmentedControl>,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'tint')).toEqual({$type: 'tint', color: '#FFCC00'});
    } else {
      expect(state('Day').fill).toBe('#FFCC00');
      expect(host(p => p.text === 'Day').props.color).toBe('#000000');
      expect(host(p => p.text === 'Week').props.color).toBe(light.label);
    }
  });

  it('measures the track and its segments from the size', async () => {
    await render(<SegmentedControl selectedValue="day" size="large" testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'controlSize')).toEqual({$type: 'controlSize', size: 'large'});
    } else {
      expect(modifier(track().props, 'clip')?.shape.radius).toBe(11);
      expect(state('Day')).toMatchObject({radius: 9, height: 36});
      expect(host(p => p.text === 'Day').props.fontSize).toBe(15);
    }
  });

  it('capsules the pill shape and leaves the rounded one to the system corner', async () => {
    const {rerender} = await render(<SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'clipShape')).toBeUndefined();
    } else {
      expect(modifier(track().props, 'clip')?.shape.radius).toBe(9);
      expect(state('Day').radius).toBe(7);
    }
    await rerender(<SegmentedControl selectedValue="day" shape="pill" testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'clipShape')).toEqual({$type: 'clipShape', shape: 'capsule'});
    } else {
      // Half the 32dp track, less the 2dp inset on the segment.
      expect(modifier(track().props, 'clip')?.shape.radius).toBe(16);
      expect(state('Day').radius).toBe(14);
    }
  });

  it('disables the control', async () => {
    const onValueChange = vi.fn();
    await render(
      <SegmentedControl label="Range" selectedValue="day" onValueChange={onValueChange} disabled testID="sg">
        {items}
      </SegmentedControl>,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(modifier(track().props, 'alpha')).toEqual({$type: 'alpha', alpha: 0.4});
      // The segments drop `selectable` entirely, so nothing is left to press.
      for (const label of ['Day', 'Week', 'Month'])
        expect(nodes().find(n => nodes(n).some(c => c.props?.text === label && modifier(n.props, 'selectable')))).toBeUndefined();
      expect(onValueChange).not.toHaveBeenCalled();
    }
  });

  it('renders without a label', async () => {
    await render(<SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      expect(screen.getByTestId('sg').props.label).toBeUndefined();
    } else {
      const texts = nodes().filter(n => typeof n.props.text === 'string').map(n => n.props.text);
      expect(texts).toEqual(['Day', 'Week', 'Month']);
    }
  });

  it('reports the selected value and stays controlled', async () => {
    const onValueChange = vi.fn();
    await render(
      <SegmentedControl selectedValue="day" onValueChange={onValueChange} testID="sg">{items}</SegmentedControl>,
    );
    if (isIOS) {
      await fireEvent(screen.getByTestId('sg'), 'selectionChange', {nativeEvent: {selection: 'month'}});
      expect(screen.getByTestId('sg').props.selection).toBe('day');
    } else {
      await press('Month');
      expect(state('Day').selected).toBe(true);
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('month');
  });

  it('updates its own selection when uncontrolled', async () => {
    const onValueChange = vi.fn();
    await render(<SegmentedControl onValueChange={onValueChange} testID="sg">{items}</SegmentedControl>);
    if (isIOS) {
      await fireEvent(screen.getByTestId('sg'), 'selectionChange', {nativeEvent: {selection: 'week'}});
      expect(screen.getByTestId('sg').props.selection).toBe('week');
    } else {
      await press('Week');
      expect(state('Week').selected).toBe(true);
      expect(state('Day').selected).toBe(false);
    }
    expect(onValueChange).toHaveBeenCalledWith('week');
  });

  (isIOS ? it.skip : it)('carries no testID modifier without a testID', async () => {
    await render(<SegmentedControl selectedValue="day">{items}</SegmentedControl>);
    expect(modifier(nodes()[0].props, 'testID')).toBeUndefined();
    expect(modifier(nodes()[0].props, 'fillMaxWidth')).toBeDefined();
  });
});
