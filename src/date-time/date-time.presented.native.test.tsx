import type {PropsWithChildren} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {host, modifier, nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {DateTimePicker} from '.';

const isIOS = Platform.OS === 'ios';
const JUNE_15 = new Date(2026, 5, 15, 9, 30);
const chip = {x: 40, y: 100, width: 90, height: 24};

const palette: Partial<MaterialColors> = {onSurface: '#1B1B1FFF', onSurfaceVariant: '#45464FFF', surfaceContainerHighest: '#E6E0E9FF'};
function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}
const options = {wrapper: Material};

/** A mounted Compose dialog (Android): both dialogs carry `initialDate`. */
const dialog = () => nodes().find(n => 'initialDate' in n.props);
/** Whether a dialog is the time one: the date one carries its selectable days. */
const isTime = () => !('selectableDates' in (dialog()?.props ?? {}));
/** The SwiftUI picker inside the popover (iOS). */
const picker = () => host(p => Array.isArray(p.displayedComponents));
/** The picker's native view, which takes its events (iOS). */
const pickerView = () => screen.container.queryAll(i => typeof i.type === 'string' && Array.isArray(i.props.displayedComponents))[0];

describe(`DateTimePicker presented (${Platform.OS})`, () => {
  it('takes a day as its value and bounds, and reports the day with the date', async () => {
    const onChange = vi.fn();
    await render(<DateTimePicker mode="date" value="2026-06-15" minimumDate="2026-06-01" maximumDate={new Date(2026, 5, 30)} onChange={onChange} testID="dt"/>, options);
    if (isIOS) {
      const {props} = screen.getByTestId('dt');
      expect(new Date(props.selection).getTime()).toBe(new Date(2026, 5, 15).getTime());
      expect(new Date(props.range.start).getTime()).toBe(new Date(2026, 5, 1).getTime());
      await fireEvent(screen.getByTestId('dt'), 'dateChange', {nativeEvent: {date: new Date(2026, 5, 20).toISOString()}});
    } else {
      await act(async () => {
        modifier(host(p => modifier(p, 'clickable') != null).props, 'clickable')?.eventListener();
      });
      expect(dialog()?.props.selectableDates).toEqual({start: Date.UTC(2026, 5, 1), end: Date.UTC(2026, 5, 30)});
      await act(async () => {
        dialog()?.props.onDateSelected({nativeEvent: {date: new Date(Date.UTC(2026, 5, 20)).toISOString()}});
      });
    }
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 20), '2026-06-20');
  });

  it('draws no row, and nothing at all while it is not presented', async () => {
    await render(<DateTimePicker mode="date" value={JUNE_15} presented={false} at={chip} testID="dt"/>, options);
    if (isIOS) {
      expect(screen.getByTestId('dt').props.isPresented).toBe(false);
      expect(nodes().some(n => modifier(n.props, 'datePickerStyle')?.style === 'compact')).toBe(false);
    } else {
      expect(dialog()).toBeUndefined();
      expect(nodes()).toHaveLength(0);
    }
  });

  it('presents the picker for a day, and a pick reports the day and closes it', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    await render(<DateTimePicker mode="date" value={JUNE_15} presented at={chip} onChange={onChange} onDismiss={onDismiss} testID="dt"/>, options);
    if (isIOS) {
      // A popover from the chip's bottom edge, with the calendar.
      expect(screen.getByTestId('dt').props).toMatchObject({isPresented: true, arrowEdge: 'top'});
      expect(StyleSheet.flatten(hosts()[0].props.style)).toMatchObject({position: 'absolute', left: 40, top: 124});
      expect(modifier(picker().props, 'datePickerStyle')?.style).toBe('graphical');
      expect(picker().props.displayedComponents).toEqual(['date']);
      // SwiftUI keeps the time of day as the day changes.
      await fireEvent(pickerView(), 'dateChange', {nativeEvent: {date: new Date(2026, 5, 20, 9, 30).toISOString()}});
    } else {
      // The Material date dialog, in a host of its own over the content.
      expect(hosts()).toHaveLength(1);
      expect(dialog()?.props.initialDate).toBe(Date.UTC(2026, 5, 15));
      await act(async () => {
        dialog()?.props.onDateSelected({nativeEvent: {date: new Date(Date.UTC(2026, 5, 20)).toISOString()}});
      });
    }
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 9, 30), '2026-06-20');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('walks a day then a time in datetime mode, and reports the dismissal', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    await render(<DateTimePicker value={JUNE_15} presented at={chip} onChange={onChange} onDismiss={onDismiss} testID="dt"/>, options);
    if (isIOS) {
      // Both parts in the one calendar; a change does not close it, a tap outside does.
      expect(picker().props.displayedComponents).toEqual(['date', 'hourAndMinute']);
      await fireEvent(pickerView(), 'dateChange', {nativeEvent: {date: new Date(2026, 5, 20, 18, 0).toISOString()}});
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
      await fireEvent(screen.getByTestId('dt'), 'isPresentedChange', {nativeEvent: {isPresented: true}});
      expect(onDismiss).not.toHaveBeenCalled();
      await fireEvent(screen.getByTestId('dt'), 'isPresentedChange', {nativeEvent: {isPresented: false}});
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } else {
      await act(async () => {
        dialog()?.props.onDateSelected({nativeEvent: {date: new Date(Date.UTC(2026, 5, 20)).toISOString()}});
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(isTime()).toBe(true);
      expect(dialog()?.props.initialDate).toBe(new Date(2026, 5, 20, 9, 30).getTime());
      await act(async () => {
        dialog()?.props.onDateSelected({nativeEvent: {date: new Date(2000, 0, 1, 18, 45).toISOString()}});
      });
      expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 18, 45), '2026-06-20');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }
  });

  it('shows the wheels for a time on iOS, and starts at the time dialog on Android', async () => {
    await render(<DateTimePicker mode="time" value={JUNE_15} presented at={chip} testID="dt"/>, options);
    if (isIOS) {
      expect(modifier(picker().props, 'datePickerStyle')?.style).toBe('wheel');
    } else {
      expect(isTime()).toBe(true);
    }
  });

  (isIOS ? it.skip : it)('keeps the day when the time is dismissed, reports a dismissal of the day, and starts over when presented again', async () => {
    const onChange = vi.fn();
    const onDismiss = vi.fn();
    const {rerender} = await render(<DateTimePicker value={JUNE_15} presented onChange={onChange} onDismiss={onDismiss}/>, options);
    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date(Date.UTC(2026, 6, 4)).toISOString()}});
    });
    await act(async () => {
      dialog()?.props.onDismissRequest();
    });
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 4, 9, 30), '2026-07-04');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // The app stops presenting it, and presents it again: it starts at the day.
    await rerender(<DateTimePicker value={JUNE_15} presented={false} onChange={onChange} onDismiss={onDismiss}/>);
    expect(dialog()).toBeUndefined();
    await rerender(<DateTimePicker value={JUNE_15} presented onChange={onChange} onDismiss={onDismiss}/>);
    expect(isTime()).toBe(false);
    await act(async () => {
      dialog()?.props.onDismissRequest();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('is presented from where it sits inside a host, with no host of its own', async () => {
    await render(
      <NativeHostContext.Provider value={true}>
        <DateTimePicker mode="date" value={JUNE_15} presented accentColor="#FF9500" testID="dt"/>
      </NativeHostContext.Provider>,
      options,
    );
    expect(hosts()).toHaveLength(0);
    if (isIOS) {
      expect(screen.getByTestId('dt').props.isPresented).toBe(true);
      expect(modifier(picker().props, 'tint')?.tint.color).toBe('#FF9500');
    } else {
      expect(dialog()?.props.color).toBe('#FF9500');
    }
  });

  (isIOS ? it.skip : it)('shows the dialog a year before 100 as that year, and reports a pick in it', async () => {
    const onChange = vi.fn();
    await render(<DateTimePicker mode="date" value="0050-06-15" presented onChange={onChange}/>, options);
    // `Date.UTC(50, 5, 15)` is 1950, so the instants are written as strings.
    expect(dialog()?.props.initialDate).toBe(new Date('0050-06-15T00:00:00.000Z').getTime());
    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date('0050-06-20T00:00:00.000Z').toISOString()}});
    });
    const [picked, day] = onChange.mock.calls[0];
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([50, 5, 20]);
    expect(day).toBe('0050-06-20');
  });

  (isIOS ? it.skip : it)('bounds the dialog\'s days on one side alone', async () => {
    const {rerender} = await render(<DateTimePicker mode="date" value={JUNE_15} minimumDate="2026-06-01" presented/>, options);
    expect(dialog()?.props.selectableDates).toEqual({start: Date.UTC(2026, 5, 1), end: null});
    await rerender(<DateTimePicker mode="date" value={JUNE_15} maximumDate="2026-06-30" presented/>);
    expect(dialog()?.props.selectableDates).toEqual({start: null, end: Date.UTC(2026, 5, 30)});
  });

  it('opens from the parent\'s origin without a chip', async () => {
    await render(<DateTimePicker mode="date" value={JUNE_15} presented testID="dt"/>, options);
    if (isIOS) {
      expect(StyleSheet.flatten(hosts()[0].props.style)).toMatchObject({left: 0, top: 0});
    } else {
      expect(dialog()).toBeDefined();
    }
  });
});
