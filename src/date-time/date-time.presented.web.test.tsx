import {fireEvent, render, screen} from '@testing-library/react';
import {DateTimePicker} from '.';

const JUNE_15 = new Date(2026, 5, 15, 9, 30);
const chip = {x: 40, y: 100, width: 90, height: 24};

describe('DateTimePicker presented (web)', () => {
  const showPicker = vi.fn();

  beforeAll(() => {
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {configurable: true, writable: true, value: showPicker});
  });

  beforeEach(() => {
    showPicker.mockReset();
  });

  it('lays an unseen input over the chip and opens the browser\'s picker from it', () => {
    render(<DateTimePicker mode="date" value="2026-06-15" minimumDate="2026-06-01" maximumDate="2026-06-30" presented at={chip} label="Due" testID="dt"/>);
    const input = screen.getByTestId('dt') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveValue('2026-06-15');
    expect(input).toHaveAttribute('min', '2026-06-01');
    expect(input).toHaveAttribute('max', '2026-06-30');
    expect(input).toHaveAttribute('aria-label', 'Due');
    expect(input.style.left).toBe('40px');
    expect(input.style.top).toBe('100px');
    expect(input.style.width).toBe('90px');
    expect(input.style.opacity).toBe('0');
    expect(input.style.pointerEvents).toBe('none');
    expect(document.activeElement).toBe(input);
    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it('keeps the focused input as the picker where the browser refuses to open one', () => {
    showPicker.mockImplementation(() => {
      throw new DOMException('No user activation', 'NotAllowedError');
    });
    render(<DateTimePicker mode="date" value={JUNE_15} presented testID="dt"/>);
    expect(document.activeElement).toBe(screen.getByTestId('dt'));
  });

  it('reports a picked day and closes in date mode', () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    render(<DateTimePicker mode="date" value={JUNE_15} presented at={chip} onChange={onChange} onDismiss={onDismiss} testID="dt"/>);
    fireEvent.change(screen.getByTestId('dt'), {target: {value: '2026-06-20'}});
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 9, 30), '2026-06-20');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays open as a datetime changes, and closes on blur or Escape', () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    render(<DateTimePicker value={JUNE_15} presented at={chip} onChange={onChange} onDismiss={onDismiss} testID="dt"/>);
    const input = screen.getByTestId('dt');
    fireEvent.change(input, {target: {value: '2026-06-20T18:45'}});
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 18, 45), '2026-06-20');
    // An empty value changes nothing and closes nothing.
    fireEvent.change(input, {target: {value: ''}});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.keyDown(input, {key: 'a'});
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('opens nothing and reports nothing while it is not presented', () => {
    const onDismiss = vi.fn();
    const onChange = vi.fn();
    render(<DateTimePicker mode="date" value={JUNE_15} presented={false} onChange={onChange} onDismiss={onDismiss} testID="dt"/>);
    const input = screen.getByTestId('dt');
    expect(showPicker).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('aria-label', 'Select date');
    expect(input.style.left).toBe('0px');
    fireEvent.change(input, {target: {value: '2026-06-20'}});
    fireEvent.blur(input);
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('takes day strings as the row\'s bounds too', () => {
    render(<DateTimePicker mode="date" value="2026-06-15" minimumDate="2026-06-01" maximumDate="2026-06-30"/>);
    const input = screen.getByLabelText('Select date');
    expect(input).toHaveAttribute('min', '2026-06-01');
    expect(input).toHaveAttribute('max', '2026-06-30');
    expect(input).toHaveValue('2026-06-15');
  });
});
