import {render, screen} from '@testing-library/react';
import {Progress} from '.';

describe('Progress (web)', () => {
  describe('linear', () => {
    it('renders a native <meter> spanning 0..1', () => {
      render(<Progress value={0.6} testID="bar"/>);
      const meter = screen.getByTestId('bar');
      expect(meter.tagName).toBe('METER');
      expect(meter).toHaveClass('ui-progress');
      expect(meter).toHaveAttribute('min', '0');
      expect(meter).toHaveAttribute('max', '1');
      expect(meter).toHaveAttribute('value', '0.6');
    });

    it('clamps out-of-range values and treats undefined as empty', () => {
      const {rerender} = render(<Progress value={1.7} testID="bar"/>);
      expect(screen.getByTestId('bar')).toHaveAttribute('value', '1');

      rerender(<Progress value={-3} testID="bar"/>);
      expect(screen.getByTestId('bar')).toHaveAttribute('value', '0');

      rerender(<Progress testID="bar"/>);
      expect(screen.getByTestId('bar')).toHaveAttribute('value', '0');
    });

    it('drives the bar and track colors through custom properties', () => {
      const {rerender} = render(<Progress value={0.5} testID="bar"/>);
      let meter = screen.getByTestId('bar');
      expect(meter.style.getPropertyValue('--ui-progress-bar')).toBe('var(--color-tint)');
      expect(meter.style.getPropertyValue('--ui-progress-track')).toBe('var(--color-background-selected)');

      rerender(<Progress value={0.5} color="#FF9500" trackColor="#FFE5B4" testID="bar"/>);
      meter = screen.getByTestId('bar');
      expect(meter.style.getPropertyValue('--ui-progress-bar')).toBe('#FF9500');
      expect(meter.style.getPropertyValue('--ui-progress-track')).toBe('#FFE5B4');
    });
  });

  describe('circular', () => {
    const STROKE = 3;

    it('renders an SVG progressbar ring sized to `size`', () => {
      render(<Progress variant="circular" value={0.5} size={40} testID="ring"/>);
      const svg = screen.getByRole('progressbar');
      expect(svg).toBe(screen.getByTestId('ring'));
      expect(svg.tagName).toBe('svg');
      expect(svg).toHaveClass('ui-progress-ring');
      expect(svg).not.toHaveClass('ui-progress-ring--indeterminate');
      expect(svg).toHaveAttribute('width', '40');
      expect(svg).toHaveAttribute('height', '40');
      expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
      expect(svg).toHaveAttribute('aria-valuemin', '0');
      expect(svg).toHaveAttribute('aria-valuemax', '1');
      expect(svg).toHaveAttribute('aria-valuenow', '0.5');
    });

    it('offsets the dash array by the remaining fraction', () => {
      render(<Progress variant="circular" value={0.25} size={24} testID="ring"/>);
      const svg = screen.getByTestId('ring');
      const radius = (24 - STROKE) / 2;
      const circumference = 2 * Math.PI * radius;
      const [track, bar] = Array.from(svg.querySelectorAll('circle'));
      expect(track).toHaveClass('ui-progress-ring__track');
      expect(track).toHaveAttribute('r', String(radius));
      expect(track).toHaveAttribute('cx', '12');
      expect(bar).toHaveClass('ui-progress-ring__bar');
      expect(bar).toHaveAttribute('stroke-width', String(STROKE));
      expect(bar).toHaveAttribute('stroke-linecap', 'round');
      expect(Number(bar.getAttribute('stroke-dasharray'))).toBeCloseTo(circumference);
      expect(Number(bar.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.75);
    });

    it('defaults to a 24pt ring', () => {
      render(<Progress variant="circular" value={1} testID="ring"/>);
      const svg = screen.getByTestId('ring');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg.querySelector('.ui-progress-ring__bar')).toHaveAttribute('stroke-dashoffset', '0');
    });

    it('spins as an activity indicator without a value', () => {
      render(<Progress variant="circular" testID="ring"/>);
      const svg = screen.getByTestId('ring');
      expect(svg).toHaveClass('ui-progress-ring--indeterminate');
      expect(svg).not.toHaveAttribute('aria-valuenow');
      const bar = svg.querySelector('.ui-progress-ring__bar')!;
      const circumference = Number(bar.getAttribute('stroke-dasharray'));
      // A quarter arc is painted while spinning.
      expect(Number(bar.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.75);
    });

    it('applies custom colors to the ring', () => {
      render(<Progress variant="circular" value={0.5} color="#0F0" trackColor="#CCC" testID="ring"/>);
      const svg = screen.getByTestId('ring');
      expect(svg.style.getPropertyValue('--ui-progress-bar')).toBe('#0F0');
      expect(svg.style.getPropertyValue('--ui-progress-track')).toBe('#CCC');
    });
  });
});
