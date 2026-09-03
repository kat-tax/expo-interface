import {render, screen} from '@testing-library/react';
import {gauge} from './shared';
import {Gauge} from '.';

const labels = {
  label: 'Speed',
  currentValueLabel: '211',
  minimumValueLabel: '0',
  maximumValueLabel: '260',
};

describe('Gauge (web)', () => {
  it('renders the automatic style as a labelled meter with a capacity bar', () => {
    render(<Gauge value={211} min={0} max={260} {...labels} testID="g"/>);
    const meter = screen.getByRole('meter', {name: 'Speed'});
    expect(meter).toBe(screen.getByTestId('g'));
    expect(meter).toHaveClass('ui-gauge', 'ui-gauge--automatic');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '260');
    expect(meter).toHaveAttribute('aria-valuenow', '211');
    expect(meter).toHaveAttribute('aria-valuetext', '211');
    expect(screen.getByText('Speed')).toHaveClass('ui-gauge__label');
    expect(screen.getByText('211')).toHaveClass('ui-gauge__current');
    expect(screen.getByText('0')).toHaveClass('ui-gauge__bound');
    expect(screen.getByText('260')).toHaveClass('ui-gauge__bound');
    const fill = meter.querySelector('.ui-gauge__fill') as HTMLElement;
    expect(fill.style.width).toBe(`${(211 / 260) * 100}%`);
  });

  it('defaults to a 0–1 range and clamps the value', () => {
    render(<Gauge value={1.5} testID="g"/>);
    const meter = screen.getByTestId('g');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '1');
    expect(meter).toHaveAttribute('aria-valuenow', '1');
    expect(meter).not.toHaveAttribute('aria-label');
    expect(meter.querySelector('.ui-gauge__label')).toBeNull();
    expect(meter.querySelector('.ui-gauge__current')).toBeNull();
    expect(meter.querySelectorAll('.ui-gauge__bound')).toHaveLength(0);
    expect((meter.querySelector('.ui-gauge__fill') as HTMLElement).style.width).toBe('100%');
  });

  it('renders the linear style with the marker at the value', () => {
    render(<Gauge value={0.25} variant="linear" {...labels} testID="g"/>);
    const meter = screen.getByTestId('g');
    expect(meter).toHaveClass('ui-gauge--linear');
    // The label is exposed to assistive technology only.
    expect(meter).toHaveAttribute('aria-label', 'Speed');
    expect(screen.queryByText('Speed')).toBeNull();
    expect(screen.queryByText('211')).toBeNull();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('260')).toBeInTheDocument();
    const marker = meter.querySelector('.ui-gauge__marker') as HTMLElement;
    expect(marker.style.left).toBe(`calc(${gauge.linear.dot / 2}px + 0.25 * (100% - ${gauge.linear.dot}px))`);
    expect(marker.querySelector('.ui-gauge__dot')).not.toBeNull();
  });

  it('lays the linear capacity style out on a grid around the bar', () => {
    render(<Gauge value={0.5} variant="linearCapacity" {...labels} testID="g"/>);
    const meter = screen.getByTestId('g');
    expect(meter).toHaveClass('ui-gauge--linear-capacity');
    expect(meter.style.gridTemplateColumns).toBe('auto minmax(0, 1fr) auto');
    const label = screen.getByText('Speed');
    expect(label.style.gridColumn).toBe('2');
    expect(label.style.gridRow).toBe('1');
    expect(screen.getByText('0').style.gridColumn).toBe('1');
    expect(screen.getByText('0').style.gridRow).toBe('2');
    const track = meter.querySelector('.ui-gauge__track') as HTMLElement;
    expect(track.style.gridColumn).toBe('2');
    expect(track.style.gridRow).toBe('2');
    expect(screen.getByText('260').style.gridColumn).toBe('3');
    expect(screen.getByText('211').style.gridColumn).toBe('2');
    expect(screen.getByText('211').style.gridRow).toBe('3');
    expect((track.querySelector('.ui-gauge__fill') as HTMLElement).style.width).toBe('50%');
  });

  it('drops the grid columns and rows of missing linear capacity labels', () => {
    render(<Gauge value={0.5} variant="linearCapacity" testID="g"/>);
    const meter = screen.getByTestId('g');
    expect(meter.style.gridTemplateColumns).toBe('minmax(0, 1fr)');
    const track = meter.querySelector('.ui-gauge__track') as HTMLElement;
    expect(track.style.gridColumn).toBe('1');
    expect(track.style.gridRow).toBe('1');
    expect(meter.querySelectorAll('.ui-gauge__bound')).toHaveLength(0);
  });

  it('places a trailing linear capacity bound right after the bar', () => {
    render(<Gauge value={0.5} variant="linearCapacity" maximumValueLabel="Max" testID="g"/>);
    expect(screen.getByTestId('g').style.gridTemplateColumns).toBe('minmax(0, 1fr) auto');
    expect(screen.getByText('Max').style.gridColumn).toBe('2');
  });

  it('draws the circular style as an open arc with a knocked-out marker', () => {
    render(<Gauge value={130} min={0} max={260} variant="circular" {...labels} testID="g"/>);
    const ring = screen.getByRole('meter', {name: 'Speed'});
    expect(ring).toHaveClass('ui-gauge-ring', 'ui-gauge-ring--circular');
    expect(ring.style.width).toBe(`${gauge.ring.size}px`);
    const arc = ring.querySelector('.ui-gauge-ring__arc') as SVGPathElement;
    expect(arc.getAttribute('d')).toMatch(/^M [\d.]+ [\d.]+ A 26.25 26.25 0 1 1 [\d.]+ [\d.]+$/);
    expect(arc.getAttribute('stroke-width')).toBe(String(gauge.ring.stroke));
    // Halfway along the arc the marker sits at the top of the ring.
    const dot = ring.querySelector('.ui-gauge-ring__dot') as SVGCircleElement;
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(gauge.ring.size / 2);
    expect(Number(dot.getAttribute('cy'))).toBeCloseTo(gauge.ring.stroke / 2);
    expect(ring.querySelector('.ui-gauge-ring__knockout')).not.toBeNull();
    expect(screen.getByText('211')).toHaveClass('ui-gauge-ring__center');
    expect(screen.getByText('211')).not.toHaveClass('ui-gauge-ring__center--label');
    const bounds = ring.querySelector('.ui-gauge-ring__bounds') as HTMLElement;
    expect(bounds.textContent).toBe('0260');
    expect(screen.queryByText('Speed')).toBeNull();
  });

  it('shows the label in the center of a ring without a current value', () => {
    render(<Gauge value={0.5} variant="circular" label="°F" minimumValueLabel="0" testID="g"/>);
    const center = screen.getByText('°F');
    expect(center).toHaveClass('ui-gauge-ring__center', 'ui-gauge-ring__center--label');
    // A single bound still renders the row, with an empty trailing slot.
    const bounds = screen.getByTestId('g').querySelector('.ui-gauge-ring__bounds') as HTMLElement;
    expect(bounds.children).toHaveLength(2);
    expect(bounds.children[0].textContent).toBe('0');
    expect(bounds.children[1].textContent).toBe('');
  });

  it('keeps an empty leading slot when only the maximum bound is set', () => {
    render(<Gauge value={0.5} variant="circular" maximumValueLabel="9" testID="g"/>);
    const ring = screen.getByTestId('g');
    const bounds = ring.querySelector('.ui-gauge-ring__bounds') as HTMLElement;
    expect(bounds.children[0].textContent).toBe('');
    expect(bounds.children[1].textContent).toBe('9');
    expect(ring.querySelector('.ui-gauge-ring__center')).toBeNull();
  });

  it('fills the circular capacity ring to the value', () => {
    render(<Gauge value={0.75} variant="circularCapacity" currentValueLabel="75%" minimumValueLabel="0" testID="g"/>);
    const ring = screen.getByTestId('g');
    expect(ring).toHaveClass('ui-gauge-ring--circularCapacity');
    expect(ring.querySelector('.ui-gauge-ring__track')).not.toBeNull();
    const fill = ring.querySelector('.ui-gauge-ring__fill') as SVGCircleElement;
    const circumference = 2 * Math.PI * ((gauge.ring.size - gauge.ring.stroke) / 2);
    expect(fill.getAttribute('stroke-dasharray')).toBe(`${0.75 * circumference} ${circumference}`);
    expect(fill.getAttribute('transform')).toBe(`rotate(-90 ${gauge.ring.size / 2} ${gauge.ring.size / 2})`);
    expect(screen.getByText('75%')).toBeInTheDocument();
    // Bounds only belong to the open ring.
    expect(ring.querySelector('.ui-gauge-ring__bounds')).toBeNull();
    expect(ring.querySelector('.ui-gauge-ring__arc')).toBeNull();
  });

  it('omits the fill of an empty capacity ring so the round cap does not show', () => {
    render(<Gauge value={0} variant="circularCapacity" testID="g"/>);
    expect(screen.getByTestId('g').querySelector('.ui-gauge-ring__fill')).toBeNull();
  });

  it('exposes a custom accent through a CSS custom property', () => {
    render(<Gauge value={0.5} accentColor="#FF9500" testID="g"/>);
    expect(screen.getByTestId('g').style.getPropertyValue('--ui-gauge-accent')).toBe('#FF9500');
  });

  it('flattens the container style into inline CSS', () => {
    render(<Gauge value={0.5} variant="circular" style={{opacity: 0.5, marginTop: 4}} testID="g"/>);
    const ring = screen.getByTestId('g');
    expect(ring.style.opacity).toBe('0.5');
    expect(ring.style.marginTop).toBe('4px');
  });
});
