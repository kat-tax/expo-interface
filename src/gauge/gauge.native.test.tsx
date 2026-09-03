import type {HostNode} from '../__tests__/native';
import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {setColorScheme} from 'vitest-native/helpers';
import {AccentProvider} from '../accent';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {gauge, markerOffset, track} from './shared';
import {Gauge} from '.';

const isIOS = Platform.OS === 'ios';
const root = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

const palette: Partial<MaterialColors> = {onSurface: '#1B1B1FFF', onSurfaceVariant: '#45464FFF'};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};
const labels = {label: 'Speed', currentValueLabel: '211', minimumValueLabel: '0', maximumValueLabel: '260'};

/** Compose `Text` host node showing `text`. */
const text = (value: string) => host(p => p.text === value);
const texts = (value: string) => nodes().filter(n => n.props?.text === value);
const ring = () => host(p => p.strokeCap === 'round' && p.strokeWidth === gauge.ring.stroke);
/** First child host node of `node`. */
const child = (node: HostNode, index = 0): HostNode => {
  const found = node.children?.[index];
  if (!found || typeof found === 'string') throw new Error(`No child ${index}`);
  return found;
};
const box = (predicate: (m: (type: string) => Record<string, any> | undefined) => boolean) =>
  host(p => p.modifiers != null && predicate(type => modifier(p, type)));

describe(`Gauge (${Platform.OS})`, () => {
  if (isIOS) {
    it('renders the SwiftUI gauge with its range, style and label slots', async () => {
      await render(<Gauge value={211} min={0} max={260} {...labels} testID="g"/>, options);
      const {props} = root('g');
      expect(props.value).toBe(211);
      expect(props.min).toBe(0);
      expect(props.max).toBe(260);
      expect(props.modifiers).toEqual([{$type: 'gaugeStyle', style: 'automatic'}]);
      const slots = nodes().filter(n => n.props?.name != null).map(n => n.props.name);
      expect(slots).toEqual(['label', 'currentValue', 'minimumValue', 'maximumValue']);
      for (const value of ['Speed', '211', '0', '260']) expect(text(value)).toBeTruthy();
    });

    it('defaults to a 0–1 range without label slots', async () => {
      await render(<Gauge value={0.5} testID="g"/>, options);
      const {props} = root('g');
      expect(props.min).toBe(0);
      expect(props.max).toBe(1);
      expect(nodes().filter(n => n.props?.name != null)).toHaveLength(0);
    });

    it('maps the variant to the gaugeStyle modifier and tints with accentColor', async () => {
      await render(<Gauge value={0.5} variant="circularCapacity" accentColor="#FF9500" testID="g"/>, options);
      expect(root('g').props.modifiers).toEqual([
        {$type: 'gaugeStyle', style: 'circularCapacity'},
        {$type: 'tint', color: '#FF9500'},
      ]);
    });
    return;
  }

  it('renders the automatic style as a centered stack around a capacity bar', async () => {
    await render(<Gauge value={211} min={0} max={260} {...labels} testID="g"/>, options);
    const column = root('g');
    expect(column.props.horizontalAlignment).toBe('center');
    expect(modifier(column.props, 'fillMaxWidth')).toBeDefined();
    expect(text('Speed').props.color).toBe(palette.onSurface);
    expect(text('Speed').props.fontSize).toBe(gauge.fontSize);
    for (const value of ['211', '0', '260']) expect(text(value).props.color).toBe(colors.light.tint);
    const spacers = nodes().filter(n => n.type.endsWith('SpacerView')).map(n => modifier(n.props, 'height')?.height);
    expect(spacers).toEqual([gauge.automatic.gapAbove, gauge.automatic.gapBelow]);
    const bar = box(m => m('height')?.height === gauge.automatic.bar);
    expect(modifier(bar.props, 'background')?.color).toBe(track.automatic.light);
    expect(modifier(bar.props, 'weight')?.weight).toBe(1);
    const fill = child(bar);
    expect(modifier(fill.props, 'fillMaxWidth')?.fraction).toBeCloseTo(211 / 260);
    expect(modifier(fill.props, 'background')?.color).toBe(colors.light.tint);
  });

  it('omits the automatic labels and spacers that are not set', async () => {
    await render(<Gauge value={0.5} testID="g"/>, options);
    expect(nodes().filter(n => n.type.endsWith('TextView'))).toHaveLength(0);
    expect(nodes().filter(n => n.type.endsWith('SpacerView'))).toHaveLength(0);
  });

  it('uses the dark track fill in the dark scheme', async () => {
    await act(() => setColorScheme('dark'));
    try {
      await render(<Gauge value={0.5} testID="g"/>, options);
      const bar = box(m => m('height')?.height === gauge.automatic.bar);
      expect(modifier(bar.props, 'background')?.color).toBe(track.automatic.dark);
    } finally {
      await act(() => setColorScheme('light'));
    }
  });

  it('renders the linear style with the marker positioned along the bar', async () => {
    await render(<Gauge value={0.25} variant="linear" {...labels} testID="g"/>, options);
    const row = root('g');
    expect(row.props.horizontalArrangement).toEqual({spacedBy: gauge.rowGap});
    expect(texts('Speed')).toHaveLength(0);
    expect(texts('211')).toHaveLength(0);
    expect(text('0')).toBeTruthy();
    expect(text('260')).toBeTruthy();
    const bar = box(m => m('height')?.height === gauge.linear.bar);
    expect(modifier(bar.props, 'background')?.color).toBe(colors.light.tint);
    const travel = box(m => m('fillMaxWidth')?.fraction === 0.25);
    expect(travel.props.contentAlignment).toBe('centerEnd');
    const knockout = child(travel);
    expect(modifier(knockout.props, 'size')).toEqual({$type: 'size', width: gauge.linear.knockout, height: gauge.linear.knockout});
    expect(modifier(knockout.props, 'offset')).toEqual({$type: 'offset', x: gauge.linear.knockout / 2, y: 0});
    expect(modifier(knockout.props, 'background')?.color).toBe(colors.light.background);
    const dot = child(knockout);
    expect(modifier(dot.props, 'size')?.width).toBe(gauge.linear.dot);
    expect(modifier(dot.props, 'background')?.color).toBe(colors.light.tint);
  });

  it('stacks the linear capacity label and value over a ghost of the minimum label', async () => {
    await render(<Gauge value={0.5} variant="linearCapacity" {...labels} testID="g"/>, options);
    const column = root('g');
    expect(column.props.verticalArrangement).toEqual({spacedBy: gauge.linearCapacity.gap});
    const ghosts = texts('0').filter(n => modifier(n.props, 'alpha')?.alpha === 0);
    expect(ghosts).toHaveLength(2);
    expect(texts('0')).toHaveLength(3);
    expect(text('Speed').props.color).toBe(palette.onSurface);
    expect(text('211').props.fontSize).toBe(gauge.linearCapacity.currentFontSize);
    expect(text('211').props.color).toBe(colors.light.tint);
    const bar = box(m => m('height')?.height === gauge.linearCapacity.bar);
    expect(modifier(bar.props, 'background')?.color).toBe(track.linearCapacity.light);
    expect(modifier(child(bar).props, 'fillMaxWidth')?.fraction).toBe(0.5);
  });

  it('renders the linear capacity bar alone without labels', async () => {
    await render(<Gauge value={0.5} variant="linearCapacity" testID="g"/>, options);
    expect(nodes().filter(n => n.type.endsWith('TextView'))).toHaveLength(0);
    expect(nodes().filter(n => n.type.endsWith('RowView'))).toHaveLength(1);
  });

  it('draws the circular style as a rotated open arc with a knocked-out marker', async () => {
    await render(<Gauge value={130} min={0} max={260} variant="circular" {...labels} testID="g"/>, options);
    const frame = root('g');
    expect(frame.props.contentAlignment).toBe('center');
    expect(modifier(frame.props, 'size')).toEqual({$type: 'size', width: gauge.ring.size, height: gauge.ring.size});
    const arc = ring();
    expect(arc.props.progress).toBeCloseTo(gauge.ring.arcSweep / 360);
    expect(arc.props.trackColor).toBe('#00000000');
    expect(arc.props.color).toBe(colors.light.tint);
    expect(modifier(arc.props, 'rotate')?.degrees).toBe(gauge.ring.arcStart - 270);
    const {x, y} = markerOffset(0.5);
    const knockout = box(m => m('offset')?.x === x && m('offset')?.y === y);
    expect(modifier(knockout.props, 'size')?.width).toBe(gauge.ring.knockout);
    expect(modifier(knockout.props, 'background')?.color).toBe(colors.light.background);
    expect(modifier(child(knockout).props, 'size')?.width).toBe(gauge.ring.dot);
    expect(text('211').props.fontSize).toBe(gauge.ring.centerFontSize);
    expect(text('211').props.color).toBe(colors.light.tint);
    const bounds = host(p => p.horizontalArrangement === 'spaceBetween');
    expect(modifier(bounds.props, 'width')?.width).toBe(gauge.ring.boundsWidth);
    expect(modifier(bounds.props, 'offset')).toEqual({$type: 'offset', x: 0, y: gauge.ring.boundsOffset});
    expect(text('0').props.fontSize).toBe(gauge.ring.boundsFontSize);
    expect(text('260').props.fontSize).toBe(gauge.ring.boundsFontSize);
    expect(texts('Speed')).toHaveLength(0);
  });

  it('shows the label in the center of a ring without a current value', async () => {
    await render(<Gauge value={0.5} variant="circular" label="°F" minimumValueLabel="0" testID="g"/>, options);
    expect(text('°F').props.color).toBe(palette.onSurface);
    expect(text('°F').props.fontSize).toBe(gauge.ring.centerFontSize);
    // A single bound still renders the row, with a spacer in the empty slot.
    const bounds = host(p => p.horizontalArrangement === 'spaceBetween');
    expect(bounds.children).toHaveLength(2);
    expect(child(bounds, 1).type).toMatch(/SpacerView$/);
  });

  it('keeps a spacer in the leading slot when only the maximum bound is set', async () => {
    await render(<Gauge value={0.5} variant="circular" maximumValueLabel="9" testID="g"/>, options);
    const bounds = host(p => p.horizontalArrangement === 'spaceBetween');
    expect(child(bounds).type).toMatch(/SpacerView$/);
    expect(child(bounds, 1).props.text).toBe('9');
    expect(nodes().filter(n => n.type.endsWith('TextView'))).toHaveLength(1);
  });

  it('fills the circular capacity ring to the value over a translucent track', async () => {
    await render(<Gauge value={0.75} variant="circularCapacity" currentValueLabel="75%" minimumValueLabel="0" testID="g"/>, options);
    const fill = ring();
    expect(fill.props.progress).toBe(0.75);
    expect(fill.props.trackColor).toBe('#007AFF4D');
    expect(modifier(fill.props, 'rotate')).toBeUndefined();
    expect(text('75%')).toBeTruthy();
    // No marker and no bounds row on the closed ring.
    expect(nodes().filter(n => modifier(n.props ?? {}, 'clip'))).toHaveLength(0);
    expect(nodes().filter(n => n.props?.horizontalArrangement === 'spaceBetween')).toHaveLength(0);
  });

  it('follows the accent seed and an explicit accentColor', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Gauge value={0.5} variant="circularCapacity" testID="seeded"/>
        <Gauge value={0.5} variant="circularCapacity" accentColor="#FF9500" testID="explicit"/>
      </AccentProvider>,
      options,
    );
    const rings = nodes().filter(n => n.props?.strokeCap === 'round');
    expect(rings.map(n => n.props.color)).toEqual(['#8959EA', '#FF9500']);
    expect(rings.map(n => n.props.trackColor)).toEqual(['#8959EA4D', '#FF95004D']);
  });

  it('carries no testID modifier without a testID', async () => {
    await render(<Gauge value={0.5}/>, options);
    expect(nodes()[0].props.modifiers).toEqual([{$type: 'fillMaxWidth'}]);
  });
});
