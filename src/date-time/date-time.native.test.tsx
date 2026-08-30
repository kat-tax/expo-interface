import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {host, modifier, nodes} from '../../jest/native';
import {formatValue} from './shared';
import {DateTimePicker} from '.';

const isIOS = Platform.OS === 'ios';
const JUNE_15 = new Date(2026, 5, 15, 9, 30);

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
  surfaceContainerHighest: '#E6E0E9FF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

/** The Compose pill showing the formatted value (Android only). */
const pill = () => host(p => modifier(p, 'background') != null);

/** A mounted Compose dialog (Android only); both dialogs carry `initialDate`. */
const dialog = () => nodes().find(n => 'initialDate' in n.props);

describe(`DateTimePicker (${Platform.OS})`, () => {
  it('renders the native picker with its label and value', async () => {
    await render(<DateTimePicker label="Starts" value={JUNE_15} onChange={jest.fn()} testID="dt"/>, options);
    if (isIOS) {
      const {props} = screen.getByTestId('dt');
      expect(props.title).toBe('Starts');
      expect(new Date(props.selection).getTime()).toBe(JUNE_15.getTime());
      expect(props.displayedComponents).toEqual(['date', 'hourAndMinute']);
      expect(props.range).toBeUndefined();
      expect(modifier(props, 'datePickerStyle')).toEqual({$type: 'datePickerStyle', style: 'compact'});
      expect(modifier(props, 'tint')).toBeUndefined();
      expect(modifier(props, 'disabled')).toBeUndefined();
    } else {
      expect(host(p => p.text === 'Starts').props.color).toBe(palette.onSurface);
      expect(pill().props.text).toBe(formatValue(JUNE_15, 'datetime'));
      expect(pill().props.text).toMatch(/15 Jun 2026, 9:30\sAM/);
      expect(pill().props.color).toBe(palette.onSurface);
      expect(modifier(pill().props, 'clip')).toEqual({$type: 'clip', shape: {type: 'roundedCorner', radius: 8}});
      expect(modifier(pill().props, 'background')?.color).toBe(palette.surfaceContainerHighest);
      expect(modifier(pill().props, 'clickable')).toBeDefined();
      expect(modifier(pill().props, 'padding')).toEqual({$type: 'padding', start: 12, top: 6, end: 12, bottom: 6});
      expect(dialog()).toBeUndefined();
    }
  });

  it('maps each mode to the native components', async () => {
    const {rerender} = await render(<DateTimePicker mode="date" value={JUNE_15} testID="dt"/>, options);
    if (isIOS) {
      expect(screen.getByTestId('dt').props.displayedComponents).toEqual(['date']);
    } else {
      expect(pill().props.text).toBe('15 Jun 2026');
    }
    await rerender(<DateTimePicker mode="time" value={JUNE_15} testID="dt"/>);
    if (isIOS) {
      expect(screen.getByTestId('dt').props.displayedComponents).toEqual(['hourAndMinute']);
    } else {
      expect(pill().props.text).toMatch(/^9:30\sAM$/);
    }
  });

  it('forwards the selectable range', async () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 30);
    await render(<DateTimePicker mode="date" value={JUNE_15} minimumDate={start} maximumDate={end} testID="dt"/>, options);
    if (isIOS) {
      const {range} = screen.getByTestId('dt').props;
      expect(new Date(range.start).getTime()).toBe(start.getTime());
      expect(new Date(range.end).getTime()).toBe(end.getTime());
    } else {
      await act(async () => {
        modifier(pill().props, 'clickable')?.eventListener();
      });
      expect(dialog()?.props.selectableDates).toEqual({start: start.getTime(), end: end.getTime()});
    }
  });

  it('leaves the picker on the host tint by default and applies an explicit accentColor', async () => {
    const {rerender} = await render(
      <AccentProvider seed="#8959EA">
        <DateTimePicker mode="date" value={JUNE_15} testID="dt"/>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('dt').props, 'tint')).toBeUndefined();
    } else {
      expect(pill().props.color).toBe(palette.onSurface);
      await act(async () => {
        modifier(pill().props, 'clickable')?.eventListener();
      });
      expect(dialog()?.props.color).toBe('#8959EA');
    }
    await rerender(<DateTimePicker mode="date" value={JUNE_15} accentColor="#FF9500" testID="dt"/>);
    if (isIOS) {
      expect(modifier(screen.getByTestId('dt').props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
    } else {
      expect(pill().props.color).toBe('#FF9500');
    }
  });

  it('disables the control', async () => {
    await render(
      <DateTimePicker label="Starts" value={JUNE_15} accentColor="#FF9500" disabled testID="dt"/>,
      options,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('dt').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(modifier(pill().props, 'clickable')).toBeUndefined();
      expect(host(p => p.text === 'Starts').props.color).toBe(palette.onSurfaceVariant);
      // A disabled picker ignores the accent and greys the value.
      expect(pill().props.color).toBe(palette.onSurfaceVariant);
    }
  });

  (isIOS ? it : it.skip)('emits an explicit enabled modifier when disabled is false', async () => {
    await render(<DateTimePicker value={JUNE_15} disabled={false} testID="dt"/>, options);
    expect(modifier(screen.getByTestId('dt').props, 'disabled')).toEqual({$type: 'disabled', disabled: false});
  });

  it('renders without a label', async () => {
    await render(<DateTimePicker mode="date" value={JUNE_15} testID="dt"/>, options);
    if (isIOS) {
      expect(screen.getByTestId('dt').props.title).toBeUndefined();
    } else {
      const texts = nodes().filter(n => typeof n.props.text === 'string').map(n => n.props.text);
      expect(texts).toEqual(['15 Jun 2026']);
    }
  });

  it('seeds an uncontrolled picker with the current time', async () => {
    const before = Date.now();
    await render(<DateTimePicker testID="dt"/>, options);
    if (isIOS) {
      const selected = new Date(screen.getByTestId('dt').props.selection).getTime();
      expect(selected).toBeGreaterThanOrEqual(before - 1000);
      expect(selected).toBeLessThanOrEqual(Date.now() + 1000);
    } else {
      expect(pill().props.text).toBe(formatValue(new Date(), 'datetime'));
    }
  });

  (isIOS ? it : it.skip)('reports the picked date and stays controlled', async () => {
    const onChange = jest.fn();
    const picked = new Date(2026, 11, 24, 18, 0);
    await render(<DateTimePicker value={JUNE_15} onChange={onChange} testID="dt"/>, options);
    await fireEvent(screen.getByTestId('dt'), 'dateChange', {nativeEvent: {date: picked.toISOString()}});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(onChange.mock.calls[0][0].getTime()).toBe(picked.getTime());
    expect(new Date(screen.getByTestId('dt').props.selection).getTime()).toBe(JUNE_15.getTime());
  });

  (isIOS ? it : it.skip)('updates its own value when uncontrolled', async () => {
    const picked = new Date(2030, 0, 2, 8, 0);
    await render(<DateTimePicker testID="dt"/>, options);
    await fireEvent(screen.getByTestId('dt'), 'dateChange', {nativeEvent: {date: picked.toISOString()}});
    expect(new Date(screen.getByTestId('dt').props.selection).getTime()).toBe(picked.getTime());
  });

  (isIOS ? it.skip : it)('walks through the date and time dialogs in datetime mode', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker value={JUNE_15} onChange={onChange}/>, options);
    await act(async () => {
      modifier(pill().props, 'clickable')?.eventListener();
    });
    expect(dialog()?.props.initialDate).toBe(JUNE_15.getTime());
    expect(dialog()?.props.color).toBe('#007AFF');
    expect(dialog()?.props.selectableDates).toBeNull();

    // Picking a day keeps the original time and hands off to the time dialog.
    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date(2026, 11, 24, 0, 0).toISOString()}});
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(dialog()?.props.initialDate).toBe(new Date(2026, 11, 24, 9, 30).getTime());

    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date(2000, 0, 1, 18, 45).toISOString()}});
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getTime()).toBe(new Date(2026, 11, 24, 18, 45).getTime());
    expect(dialog()).toBeUndefined();
    // Still controlled: the pill shows the prop value.
    expect(pill().props.text).toBe(formatValue(JUNE_15, 'datetime'));
  });

  (isIOS ? it.skip : it)('commits the picked day when the time dialog is dismissed', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker onChange={onChange}/>, options);
    await act(async () => {
      modifier(pill().props, 'clickable')?.eventListener();
    });
    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date(2030, 0, 2).toISOString()}});
    });
    await act(async () => {
      dialog()?.props.onDismissRequest();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    const next: Date = onChange.mock.calls[0][0];
    expect([next.getFullYear(), next.getMonth(), next.getDate()]).toEqual([2030, 0, 2]);
    expect(dialog()).toBeUndefined();
    expect(pill().props.text).toBe(formatValue(next, 'datetime'));
  });

  (isIOS ? it.skip : it)('opens only the matching dialog in single-component modes', async () => {
    const onChange = jest.fn();
    const {rerender} = await render(<DateTimePicker mode="date" value={JUNE_15} onChange={onChange}/>, options);
    await act(async () => {
      modifier(pill().props, 'clickable')?.eventListener();
    });
    await act(async () => {
      dialog()?.props.onDateSelected({nativeEvent: {date: new Date(2026, 11, 24).toISOString()}});
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getTime()).toBe(new Date(2026, 11, 24, 9, 30).getTime());
    expect(dialog()).toBeUndefined();

    await rerender(<DateTimePicker mode="time" value={JUNE_15} onChange={onChange}/>);
    await act(async () => {
      modifier(pill().props, 'clickable')?.eventListener();
    });
    // Dismissing the time dialog without a draft leaves the value untouched.
    await act(async () => {
      dialog()?.props.onDismissRequest();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeUndefined();
  });
});
