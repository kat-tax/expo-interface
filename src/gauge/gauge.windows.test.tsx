import {render, screen} from '@testing-library/react-native';
import {island, islands} from 'expo-vitest/windows';
import {gauge} from './shared';
import {Gauge} from '.';

const RING = 'ExpoInterfaceProgress';

describe('Gauge (windows)', () => {
  it('draws the automatic style: label, bounded bar and current value', async () => {
    await render(<Gauge value={0.4} label="Battery" currentValueLabel="40%" minimumValueLabel="0" maximumValueLabel="100" testID="battery"/>);
    const meter = screen.getByTestId('battery');
    expect(meter.props.accessibilityValue).toEqual({min: 0, max: 1, now: 0.4, text: '40%'});
    for (const text of ['Battery', '40%', '0', '100']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.getByText('40%')).toHaveStyle({color: '#007AFF'});
    expect(islands(RING)).toHaveLength(0);
  });

  it('draws the linear capacity style leading-aligned, with the accent', async () => {
    await render(<Gauge value={2} min={0} max={4} variant="linearCapacity" label="Used" currentValueLabel="2 GB" accentColor="#FF9500" testID="used"/>);
    expect(screen.getByText('Used')).toHaveStyle({alignSelf: 'flex-start'});
    expect(screen.getByText('2 GB')).toHaveStyle({color: '#FF9500', fontSize: gauge.linearCapacity.currentFontSize});
  });

  it('draws the linear style as a bar with a marker between the bounds', async () => {
    await render(<Gauge value={0.5} variant="linear" minimumValueLabel="E" maximumValueLabel="F" testID="fuel"/>);
    expect(screen.getByText('E')).toBeOnTheScreen();
    expect(screen.getByText('F')).toBeOnTheScreen();
    expect(screen.getByTestId('fuel')).toBeOnTheScreen();
  });

  it('draws the circular styles as a ProgressRing island with the value in the center', async () => {
    await render(<Gauge value={0.75} variant="circular" currentValueLabel="75" minimumValueLabel="0" maximumValueLabel="1" testID="ring"/>);
    expect(island(RING).props).toMatchObject({variant: 'circular', value: 0.75, size: gauge.ring.size, color: '#007AFF', trackColor: 'transparent'});
    expect(screen.getByText('75')).toHaveStyle({color: '#007AFF'});
    expect(screen.getByText('0')).toBeOnTheScreen();
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('keeps the track and shows the label in the center of a capacity ring', async () => {
    await render(<Gauge value={0.2} variant="circularCapacity" label="CPU" minimumValueLabel="0" testID="ring"/>);
    expect(island(RING).props.trackColor).toBeUndefined();
    expect(screen.getByText('CPU')).toHaveStyle({color: '#000000'});
    expect(screen.queryByText('0')).toBeNull();
  });

  it('draws a ring with nothing in the center, and one bound alone', async () => {
    await render(<Gauge value={0.2} variant="circular"/>);
    expect(island(RING)).toBeTruthy();
    await screen.unmount();
    await render(<Gauge value={0.2} variant="circular" maximumValueLabel="1"/>);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('')).toBeOnTheScreen();
    await screen.unmount();
    await render(<Gauge value={0.2} variant="circular" minimumValueLabel="0"/>);
    expect(screen.getByText('0')).toBeOnTheScreen();
    expect(screen.getByText('')).toBeOnTheScreen();
  });

  it('draws a bare automatic bar without labels', async () => {
    await render(<Gauge value={0.5} testID="bare"/>);
    expect(screen.getByTestId('bare')).toBeOnTheScreen();
    expect(screen.getByTestId('bare').props.accessibilityLabel).toBeUndefined();
  });
});
