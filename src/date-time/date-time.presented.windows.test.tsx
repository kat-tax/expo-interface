import {render} from '@testing-library/react-native';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {DateTimePicker} from '.';

const FLYOUT = 'ExpoInterfaceDateFlyout';
const noon = new Date(2026, 5, 15, 12, 30);
const chip = {x: 40, y: 100, width: 90, height: 24};

describe('DateTimePicker presented (windows)', () => {
  it('opens the calendar in a flyout under the chip, from a one-point island, with no row', async () => {
    await render(<DateTimePicker mode="date" value="2026-06-15" minimumDate="2026-06-01" maximumDate={new Date(2026, 5, 30)} presented at={chip} testID="dt"/>);
    expect(islands('ExpoInterfaceDatePicker')).toHaveLength(0);
    expect(island(FLYOUT).props).toMatchObject({
      open: true,
      mode: 'date',
      date: '2026-06-15',
      minDate: '2026-06-01',
      maxDate: '2026-06-30',
      x: 40,
      y: 124,
      testID: 'dt',
    });
    expect(island(FLYOUT).props.style).toMatchObject({position: 'absolute', width: 1, height: 1, pointerEvents: 'none'});
  });

  it('reports a picked day and closes in date mode, ignoring a malformed one', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    await render(<DateTimePicker mode="date" value={noon} presented at={chip} onChange={onChange} onDismiss={onDismiss}/>);
    await fireIsland(island(FLYOUT), 'dateChange', {date: 'soon'});
    expect(onChange).not.toHaveBeenCalled();
    await fireIsland(island(FLYOUT), 'dateChange', {date: '2026-07-04'});
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 4, 12, 30), '2026-07-04');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('walks a day then a time in datetime mode', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    await render(<DateTimePicker value={noon} presented onChange={onChange} onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props).toMatchObject({mode: 'date', x: 0, y: 0});
    await fireIsland(island(FLYOUT), 'dateChange', {date: '2026-07-04'});
    expect(onChange).not.toHaveBeenCalled();
    // The flyout swaps to the time, showing the day picked on the way.
    expect(island(FLYOUT).props).toMatchObject({mode: 'time', date: '2026-07-04', time: '12:30'});
    await fireIsland(island(FLYOUT), 'timeChange', {time: 'noon'});
    expect(onChange).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('reports a time picked in time mode and closes', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    await render(<DateTimePicker mode="time" value={noon} presented onChange={onChange} onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props.mode).toBe('time');
    await fireIsland(island(FLYOUT), 'timeChange', {time: '08:05'});
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 15, 8, 5), '2026-06-15');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps the day on a light dismiss of the time, reports one of the day, and starts over when presented again', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    const {rerender} = await render(<DateTimePicker value={noon} presented onChange={onChange} onDismiss={onDismiss}/>);
    await fireIsland(island(FLYOUT), 'openChange', {open: true});
    await fireIsland(island(FLYOUT), 'dateChange', {date: '2026-07-04'});
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 4, 12, 30), '2026-07-04');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // The app stops presenting it: the close that follows is its own.
    await rerender(<DateTimePicker value={noon} presented={false} onChange={onChange} onDismiss={onDismiss}/>);
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(island(FLYOUT).props.open).toBe(false);
    // Presented again: back at the day, and a dismissal of it changes nothing.
    await rerender(<DateTimePicker value={noon} presented onChange={onChange} onDismiss={onDismiss}/>);
    expect(island(FLYOUT).props.mode).toBe('date');
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('takes an accent of its own', async () => {
    await render(<DateTimePicker mode="date" value={noon} presented accentColor="#FF9500"/>);
    expect(island(FLYOUT).props.accentColor).toBe('#FF9500');
  });
});
