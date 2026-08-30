import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {Slider} from '.';

const isIOS = Platform.OS === 'ios';
const slider = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

describe(`Slider (${Platform.OS})`, () => {
  it('renders the native slider with its label and default range', async () => {
    await render(<Slider label="Brightness" value={0.5} onValueChange={vi.fn()} testID="sl"/>, options);
    const {props} = slider('sl');
    expect(props.value).toBe(0.5);
    expect(props.min).toBe(0);
    expect(props.max).toBe(1);
    if (isIOS) {
      expect(props.step).toBeUndefined();
      expect(props.modifiers).toEqual([]);
      const label = host(p => p.text === 'Brightness');
      expect(modifier(label.props, 'foregroundStyle')?.color).toBe('#000000');
      expect(host(p => p.spacing === 12)).toBeTruthy();
    } else {
      // `@expo/ui` normalises an omitted `steps` to 0, i.e. continuous.
      expect(props.steps).toBe(0);
      expect(props.enabled).toBe(true);
      expect(modifier(props, 'weight')).toEqual({$type: 'weight', weight: 1});
      expect(modifier(props, 'fillMaxWidth')).toBeUndefined();
      expect(host(p => p.text === 'Brightness').props.color).toBe(palette.onSurface);
    }
  });

  it('maps min, max and step to the native range', async () => {
    await render(<Slider value={40} min={0} max={100} step={10} onValueChange={vi.fn()} testID="sl"/>, options);
    const {props} = slider('sl');
    expect(props.value).toBe(40);
    expect(props.min).toBe(0);
    expect(props.max).toBe(100);
    if (isIOS) {
      expect(props.step).toBe(10);
    } else {
      // Compose counts the discrete intervals between the bounds (exclusive).
      expect(props.steps).toBe(9);
    }
  });

  it('colors the slider with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Slider value={0.5} onValueChange={vi.fn()} testID="sl"/>
      </AccentProvider>,
      options,
    );
    const {props} = slider('sl');
    if (isIOS) {
      // The Host `tint` cascade colors it; no per-instance modifier is emitted.
      expect(modifier(props, 'tint')).toBeUndefined();
    } else {
      expect(props.colors).toEqual({
        thumbColor: '#8959EA',
        activeTrackColor: '#8959EA',
        inactiveTrackColor: '#E0E1E6',
        activeTickColor: '#E0E1E6',
        inactiveTickColor: '#8959EA',
      });
    }
  });

  it('applies an explicit accentColor', async () => {
    await render(<Slider value={0.5} onValueChange={vi.fn()} accentColor="#FF9500" testID="sl"/>, options);
    const {props} = slider('sl');
    if (isIOS) {
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
    } else {
      expect(props.colors.thumbColor).toBe('#FF9500');
      expect(props.colors.activeTrackColor).toBe('#FF9500');
    }
  });

  it('disables the control', async () => {
    await render(<Slider label="Volume" value={0.5} onValueChange={vi.fn()} disabled testID="sl"/>, options);
    const {props} = slider('sl');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(host(p => p.text === 'Volume').props, 'foregroundStyle')?.color).toBe('#60646C');
    } else {
      expect(props.enabled).toBe(false);
      expect(props.onValueChange).toBeUndefined();
      expect(host(p => p.text === 'Volume').props.color).toBe(palette.onSurfaceVariant);
    }
  });

  it('renders only the slider without a label', async () => {
    await render(<Slider value={0.5} onValueChange={vi.fn()} testID="sl"/>, options);
    expect(nodes()).toHaveLength(1);
    if (!isIOS) {
      expect(modifier(slider('sl').props, 'fillMaxWidth')).toBeDefined();
      expect(modifier(slider('sl').props, 'weight')).toBeUndefined();
    }
  });

  it('reports drag values through onValueChange', async () => {
    const onValueChange = vi.fn();
    await render(<Slider value={0} min={0} max={100} step={10} onValueChange={onValueChange} testID="sl"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('sl'), 'valueChanged', {nativeEvent: {value: 30}});
      expect(onValueChange).toHaveBeenCalledWith(30);
    } else {
      // Compose reports raw positions, which are snapped to the step grid.
      await act(async () => {
        slider('sl').props.onValueChange({nativeEvent: {value: 33.3}});
      });
      expect(onValueChange).toHaveBeenCalledWith(30);
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('reports the value the drag ended on, even when the parent has not re-rendered', async () => {
    // `onValueChange` is a plain mock, so the `value` prop stays 0.4 — the
    // completion value must come from the drag, not the stale prop.
    const onSlidingComplete = vi.fn();
    await render(
      <Slider value={0.4} onValueChange={vi.fn()} onSlidingComplete={onSlidingComplete} testID="sl"/>,
      options,
    );
    if (isIOS) {
      await fireEvent(screen.getByTestId('sl'), 'editingChanged', {nativeEvent: {isEditing: true}});
      await fireEvent(screen.getByTestId('sl'), 'valueChanged', {nativeEvent: {value: 0.8}});
      expect(onSlidingComplete).not.toHaveBeenCalled();
      await fireEvent(screen.getByTestId('sl'), 'editingChanged', {nativeEvent: {isEditing: false}});
    } else {
      await act(async () => {
        slider('sl').props.onValueChange({nativeEvent: {value: 0.8}});
        slider('sl').props.onValueChangeFinished();
      });
    }
    expect(onSlidingComplete).toHaveBeenCalledTimes(1);
    expect(onSlidingComplete).toHaveBeenCalledWith(0.8);
  });

  it('reports the prop value when sliding completes without a drag', async () => {
    const onSlidingComplete = vi.fn();
    await render(
      <Slider value={0.4} onValueChange={vi.fn()} onSlidingComplete={onSlidingComplete} testID="sl"/>,
      options,
    );
    if (isIOS) {
      await fireEvent(screen.getByTestId('sl'), 'editingChanged', {nativeEvent: {isEditing: false}});
    } else {
      await act(async () => {
        slider('sl').props.onValueChangeFinished();
      });
    }
    expect(onSlidingComplete).toHaveBeenCalledWith(0.4);
  });

  it('omits the completion handler when onSlidingComplete is not given', async () => {
    await render(<Slider value={0.4} onValueChange={vi.fn()} testID="sl"/>, options);
    const {props} = slider('sl');
    expect(isIOS ? props.onEditingChanged : props.onValueChangeFinished).toBeUndefined();
  });
});
