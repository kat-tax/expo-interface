import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes, type HostNode} from '../../jest/native';
import {SegmentedControl} from '.';

const isIOS = Platform.OS === 'ios';
const control = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
  outline: '#767680FF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

const items = [
  <SegmentedControl.Item key="day" label="Day" value="day"/>,
  <SegmentedControl.Item key="week" label="Week" value="week"/>,
  <SegmentedControl.Item key="month" label="Month" value="month"/>,
];

/** The Compose `SegmentedButton` whose label slot renders `label` (Android only). */
function segment(label: string): HostNode {
  const match = nodes().find(n => 'selected' in n.props && nodes(n).some(c => c.props.text === label));
  if (!match) throw new Error(`No segment labelled ${label}`);
  return match;
}

/** SwiftUI picker options as `[text, tag]` pairs (iOS only). */
const tags = () => nodes().filter(n => modifier(n.props, 'tag')).map(n => [n.props.text, modifier(n.props, 'tag')?.tag]);

describe(`SegmentedControl (${Platform.OS})`, () => {
  it('renders the native segmented control with its label and items', async () => {
    await render(
      <SegmentedControl label="Range" selectedValue="week" onValueChange={jest.fn()} testID="sg">{items}</SegmentedControl>,
      options,
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
      const row = control('sg');
      expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
      expect(row.props.horizontalArrangement).toBe('spaceBetween');
      expect(host(p => p.text === 'Range').props.color).toBe(palette.onSurface);
      expect(segment('Day').props.selected).toBe(false);
      expect(segment('Week').props.selected).toBe(true);
      expect(segment('Month').props.selected).toBe(false);
      expect(segment('Week').props.enabled).toBe(true);
    }
  });

  it('seeds an uncontrolled control with the first item', async () => {
    await render(<SegmentedControl testID="sg">{items}</SegmentedControl>, options);
    if (isIOS) {
      expect(screen.getByTestId('sg').props.selection).toBe('day');
    } else {
      expect(segment('Day').props.selected).toBe(true);
      expect(segment('Week').props.selected).toBe(false);
    }
  });

  it('keeps numeric values typed', async () => {
    await render(
      <SegmentedControl selectedValue={2} testID="sg">
        <SegmentedControl.Item label="One" value={1}/>
        <SegmentedControl.Item label="Two" value={2}/>
      </SegmentedControl>,
      options,
    );
    if (isIOS) {
      expect(screen.getByTestId('sg').props.selection).toBe(2);
      expect(tags()).toEqual([['One', 1], ['Two', 2]]);
    } else {
      expect(segment('Two').props.selected).toBe(true);
    }
  });

  it('fills the selected segment with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      // The Host `tint` cascade colors it; no per-instance modifier is emitted.
      expect(modifier(screen.getByTestId('sg').props, 'tint')).toBeUndefined();
    } else {
      expect(segment('Day').props.colors).toEqual({
        activeContainerColor: '#8959EA',
        activeContentColor: '#FFFFFF',
        activeBorderColor: palette.outline,
        inactiveContainerColor: '#00000000',
        inactiveContentColor: palette.onSurface,
        inactiveBorderColor: palette.outline,
      });
    }
  });

  it('applies an explicit accentColor', async () => {
    await render(
      <SegmentedControl selectedValue="day" accentColor="#FFCC00" testID="sg">{items}</SegmentedControl>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'tint')).toEqual({$type: 'tint', color: '#FFCC00'});
    } else {
      expect(segment('Week').props.colors.activeContainerColor).toBe('#FFCC00');
      expect(segment('Week').props.colors.activeContentColor).toBe('#000000');
    }
  });

  it('disables the control', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControl label="Range" selectedValue="day" onValueChange={onValueChange} disabled testID="sg">
        {items}
      </SegmentedControl>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sg').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      for (const label of ['Day', 'Week', 'Month']) expect(segment(label).props.enabled).toBe(false);
      expect(host(p => p.text === 'Range').props.color).toBe(palette.onSurfaceVariant);
      // `@expo/ui` always wires the press handler; the control drops its own callback.
      await act(async () => {
        segment('Week').props.onButtonPressed();
      });
      expect(onValueChange).not.toHaveBeenCalled();
    }
  });

  it('renders without a label', async () => {
    await render(<SegmentedControl selectedValue="day" testID="sg">{items}</SegmentedControl>, options);
    if (isIOS) {
      expect(screen.getByTestId('sg').props.label).toBeUndefined();
    } else {
      const texts = nodes().filter(n => typeof n.props.text === 'string').map(n => n.props.text);
      expect(texts).toEqual(['Day', 'Week', 'Month']);
    }
  });

  it('reports the selected value and stays controlled', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControl selectedValue="day" onValueChange={onValueChange} testID="sg">{items}</SegmentedControl>,
      options,
    );
    if (isIOS) {
      await fireEvent(screen.getByTestId('sg'), 'selectionChange', {nativeEvent: {selection: 'month'}});
      expect(screen.getByTestId('sg').props.selection).toBe('day');
    } else {
      await act(async () => {
        segment('Month').props.onButtonPressed();
      });
      expect(segment('Day').props.selected).toBe(true);
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('month');
  });

  it('updates its own selection when uncontrolled', async () => {
    const onValueChange = jest.fn();
    await render(<SegmentedControl onValueChange={onValueChange} testID="sg">{items}</SegmentedControl>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('sg'), 'selectionChange', {nativeEvent: {selection: 'week'}});
      expect(screen.getByTestId('sg').props.selection).toBe('week');
    } else {
      await act(async () => {
        segment('Week').props.onButtonPressed();
      });
      expect(segment('Week').props.selected).toBe(true);
      expect(segment('Day').props.selected).toBe(false);
    }
    expect(onValueChange).toHaveBeenCalledWith('week');
  });
});
