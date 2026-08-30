import {fireEvent, render, screen} from '@testing-library/react';
import {formatValue} from './shared';
import {DateTimePicker} from '.';

const JUNE_15 = new Date(2026, 5, 15, 9, 30);

const picker = (name = 'Select date') => screen.getByLabelText(name) as HTMLInputElement;

describe('DateTimePicker (web)', () => {
  const showPicker = jest.fn();

  beforeAll(() => {
    // jsdom does not implement `showPicker`; stub it so the click handler can be observed.
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      writable: true,
      value: showPicker,
    });
  });

  it('renders a labelled native datetime input over the formatted value', () => {
    render(<DateTimePicker label="Starts" value={JUNE_15} onChange={jest.fn()} testID="starts"/>);
    const control = picker('Starts');
    expect(control).toHaveAttribute('type', 'datetime-local');
    expect(control).toHaveValue('2026-06-15T09:30');
    expect(control).toBeEnabled();
    expect(screen.getByText('Starts')).toBeInTheDocument();
    expect(screen.getByText(formatValue(JUNE_15, 'datetime'))).toBeInTheDocument();
    expect(screen.getByText(/15 Jun 2026, 9:30\sAM/)).toBeInTheDocument();
    expect(screen.getByTestId('starts').contains(control)).toBe(true);
  });

  it('maps each mode to the matching input type and value', () => {
    const {rerender} = render(<DateTimePicker mode="date" value={JUNE_15}/>);
    expect(picker()).toHaveAttribute('type', 'date');
    expect(picker()).toHaveValue('2026-06-15');
    expect(screen.getByText('15 Jun 2026')).toBeInTheDocument();

    rerender(<DateTimePicker mode="time" value={JUNE_15}/>);
    expect(picker()).toHaveAttribute('type', 'time');
    expect(picker()).toHaveValue('09:30');
    expect(screen.getByText(/^9:30\sAM$/)).toBeInTheDocument();
  });

  it('forwards the selectable range as min and max', () => {
    render(
      <DateTimePicker
        mode="date"
        value={JUNE_15}
        minimumDate={new Date(2026, 5, 1)}
        maximumDate={new Date(2026, 5, 30)}
      />,
    );
    expect(picker()).toHaveAttribute('min', '2026-06-01');
    expect(picker()).toHaveAttribute('max', '2026-06-30');
  });

  it('omits min and max without a range', () => {
    render(<DateTimePicker value={JUNE_15}/>);
    expect(picker()).not.toHaveAttribute('min');
    expect(picker()).not.toHaveAttribute('max');
  });

  it('reports a merged Date through onChange and stays controlled', () => {
    const onChange = jest.fn();
    render(<DateTimePicker mode="date" value={JUNE_15} onChange={onChange}/>);
    fireEvent.change(picker(), {target: {value: '2026-12-24'}});
    expect(onChange).toHaveBeenCalledTimes(1);
    const next: Date = onChange.mock.calls[0][0];
    expect(next.getTime()).toBe(new Date(2026, 11, 24, 9, 30).getTime());
    expect(picker()).toHaveValue('2026-06-15');
  });

  it('keeps the calendar day when only the time changes', () => {
    const onChange = jest.fn();
    render(<DateTimePicker mode="time" value={JUNE_15} onChange={onChange}/>);
    fireEvent.change(picker(), {target: {value: '17:45'}});
    expect(onChange.mock.calls[0][0].getTime()).toBe(new Date(2026, 5, 15, 17, 45).getTime());
  });

  it('ignores an empty (cleared) input', () => {
    const onChange = jest.fn();
    render(<DateTimePicker value={JUNE_15} onChange={onChange}/>);
    fireEvent.change(picker(), {target: {value: ''}});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('manages its own value when uncontrolled', () => {
    const onChange = jest.fn();
    render(<DateTimePicker mode="date" onChange={onChange}/>);
    fireEvent.change(picker(), {target: {value: '2030-01-02'}});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(picker()).toHaveValue('2030-01-02');
    expect(screen.getByText('2 Jan 2030')).toBeInTheDocument();
  });

  it('opens the native picker when the overlay is clicked', () => {
    render(<DateTimePicker value={JUNE_15}/>);
    fireEvent.click(picker());
    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it('disables the input and dims the row', () => {
    render(<DateTimePicker label="Starts" value={JUNE_15} disabled/>);
    expect(picker('Starts')).toBeDisabled();
    expect(picker('Starts').style.cursor).toBe('default');
    expect(screen.getByText('Starts')).toHaveStyle({opacity: 0.4});
  });

  it('colors the value with a custom accent', () => {
    render(<DateTimePicker mode="date" value={JUNE_15} accentColor="#FF9500"/>);
    expect(screen.getByText('15 Jun 2026')).toHaveStyle({color: '#FF9500'});
  });

  it('falls back to a generic accessible name without a label', () => {
    render(<DateTimePicker value={JUNE_15} testID="bare"/>);
    expect(picker('Select date')).toBeInTheDocument();
    expect(screen.getByTestId('bare').querySelectorAll('span')).toHaveLength(1);
  });
});
