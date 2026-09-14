import {render, screen} from '@testing-library/react-native';
import {fireIsland, island, islands} from '../__tests__/windows';
import {DateTimePicker, parseDateString, parseTimeString, toDateString, toTimeString} from './index.windows';

const DATE = 'ExpoInterfaceDatePicker';
const TIME = 'ExpoInterfaceTimePicker';
const noon = new Date(2026, 5, 15, 12, 30);

describe('DateTimePicker (windows)', () => {
  it('renders both islands for datetime, with the value split between them', async () => {
    await render(<DateTimePicker label="Due" value={noon} onChange={vi.fn()} testID="due"/>);
    expect(screen.getByTestId('due')).toBeOnTheScreen();
    expect(island(DATE).props.date).toBe('2026-06-15');
    expect(island(DATE).props.minDate).toBe('');
    expect(island(DATE).props.maxDate).toBe('');
    expect(island(DATE).props.label).toBe('Due');
    expect(island(TIME).props.time).toBe('12:30');
  });

  it('renders the date island alone for date', async () => {
    await render(<DateTimePicker mode="date" value={noon}/>);
    expect(islands(DATE)).toHaveLength(1);
    expect(islands(TIME)).toHaveLength(0);
  });

  it('renders the time island alone for time', async () => {
    await render(<DateTimePicker mode="time" value={noon}/>);
    expect(islands(DATE)).toHaveLength(0);
    expect(islands(TIME)).toHaveLength(1);
  });

  it('passes the bounds, disabled state and a custom accent, dimming the label', async () => {
    await render(
      <DateTimePicker
        label="Due"
        value={noon}
        minimumDate={new Date(2026, 0, 1)}
        maximumDate={new Date(2026, 11, 31)}
        disabled
        accentColor="#FF9500"
      />,
    );
    expect(island(DATE).props).toMatchObject({minDate: '2026-01-01', maxDate: '2026-12-31', disabled: true, accentColor: '#FF9500'});
    expect(island(TIME).props).toMatchObject({disabled: true, accentColor: '#FF9500'});
    expect(screen.getByText('Due')).toHaveStyle({opacity: 0.4});
  });

  it('merges a picked day onto the time, and a picked time onto the day', async () => {
    const onChange = vi.fn();
    await render(<DateTimePicker value={noon} onChange={onChange}/>);
    await fireIsland(island(DATE), 'dateChange', {date: '2026-07-04'});
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 6, 4, 12, 30));
    await fireIsland(island(TIME), 'timeChange', {time: '08:05'});
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 5, 15, 8, 5));
  });

  it('ignores a malformed or empty value from an island', async () => {
    const onChange = vi.fn();
    await render(<DateTimePicker value={noon} onChange={onChange}/>);
    await fireIsland(island(DATE), 'dateChange', {date: ''});
    await fireIsland(island(DATE), 'dateChange', {date: 'soon'});
    await fireIsland(island(TIME), 'timeChange', {time: 'noon'});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps its own value when uncontrolled', async () => {
    await render(<DateTimePicker mode="date"/>);
    await fireIsland(island(DATE), 'dateChange', {date: '2030-02-03'});
    expect(island(DATE).props.date).toBe('2030-02-03');
  });
});

describe('date strings (windows)', () => {
  it('formats and parses local days and times', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toTimeString(new Date(2026, 0, 5, 7, 9))).toBe('07:09');
    expect(parseDateString('2026-03-09', noon)).toEqual(new Date(2026, 2, 9, 12, 30));
    expect(parseTimeString('23:59', noon)).toEqual(new Date(2026, 5, 15, 23, 59));
  });

  it('rejects what is not a day or a time', () => {
    expect(parseDateString('', noon)).toBeNull();
    expect(parseDateString('2026-xx-01', noon)).toBeNull();
    expect(parseTimeString('', noon)).toBeNull();
    expect(parseTimeString('12:zz', noon)).toBeNull();
  });
});
