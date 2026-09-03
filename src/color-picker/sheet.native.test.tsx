import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {setColorScheme} from 'vitest-native/helpers';
import {nodes} from '../__tests__/native';
import {ColorPickerSheet} from './sheet';

const layout = (element: ReturnType<typeof screen.getByLabelText>, width: number, height = 36) =>
  fireEvent(element, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width, height}}});
const touch = (element: ReturnType<typeof screen.getByLabelText>, event: 'responderGrant' | 'responderMove', x: number, y = 0) =>
  fireEvent(element, event, {nativeEvent: {locationX: x, locationY: y}});

/**
 * The picker sheet content, rendered on its own: inside the kit's `Sheet` the
 * bottom sheet's host is `pointerEvents="none"` (it is a separate window at
 * runtime), which stops the testing library from firing events into it.
 */
describe(`ColorPickerSheet (${Platform.OS})`, () => {
  it('renders the title, tabs, grid, opacity slider and footer', async () => {
    const onClose = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={vi.fn()} onClose={onClose} width={300} testID="sheet"/>);
    expect(screen.getByTestId('sheet').props.style).toEqual([expect.objectContaining({gap: 16}), {width: 300}]);
    expect(screen.getByRole('heading', {name: 'Accent'})).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByLabelText('Grid tab').props.accessibilityState.checked).toBe(true);
    expect(screen.getAllByLabelText(/^Color #/)).toHaveLength(120);
    expect(screen.getByLabelText('Opacity')).toBeTruthy();
    expect(screen.getByLabelText('Opacity percent').props.value).toBe('100%');
    expect(screen.getByLabelText('Selected color #FF6347FF')).toBeTruthy();
    expect(screen.getByLabelText('Save color')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stretches without a fixed width and hides the opacity row when unsupported', async () => {
    await render(<ColorPickerSheet title="Colors" value="#FF6347" supportsOpacity={false} onValueChange={vi.fn()} onClose={vi.fn()} testID="sheet"/>);
    expect(screen.getByTestId('sheet').props.style).toEqual([expect.objectContaining({gap: 16}), {alignSelf: 'stretch'}]);
    expect(screen.queryByLabelText('Opacity')).toBeNull();
    expect(screen.getByLabelText('Selected color #FF6347')).toBeTruthy();
  });

  it('picks a grid color, keeping the alpha, and marks it selected', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF634780" supportsOpacity onValueChange={onValueChange} onClose={vi.fn()}/>);
    const white = screen.getByLabelText('Color #FFFFFF');
    expect(white.props.accessibilityState.selected).toBe(false);
    await fireEvent.press(white);
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFFFF80');
    expect(screen.getByLabelText('Color #FFFFFF').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Selected color #FFFFFF80')).toBeTruthy();
    // A translucent preview shows the checkerboard behind the color.
    expect(nodes().filter(n => n.props?.contentFit === 'cover').length).toBeGreaterThan(0);
  });

  it('forces full opacity when opacity is unsupported', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF634780" supportsOpacity={false} onValueChange={onValueChange} onClose={vi.fn()}/>);
    await fireEvent.press(screen.getByLabelText('Color #000000'));
    expect(onValueChange).toHaveBeenLastCalledWith('#000000');
  });

  it('follows a new value from the parent', async () => {
    const {rerender} = await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={vi.fn()} onClose={vi.fn()}/>);
    await rerender(<ColorPickerSheet title="Accent" value="#00FF00" supportsOpacity onValueChange={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByLabelText('Selected color #00FF00FF')).toBeTruthy();
  });

  it('picks from the spectrum once it is laid out', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={onValueChange} onClose={vi.fn()}/>);
    await fireEvent.press(screen.getByLabelText('Spectrum tab'));
    expect(screen.queryByLabelText('Color #FFFFFF')).toBeNull();
    const spectrum = screen.getByLabelText('Spectrum');
    expect(spectrum.props.accessibilityValue).toEqual({text: '#FF6347'});
    // The drag is never handed over to an enclosing responder (a sheet, a list).
    expect(spectrum.props.onResponderTerminationRequest()).toBe(false);
    expect(spectrum.props.onMoveShouldSetResponder()).toBe(true);
    await touch(spectrum, 'responderGrant', 10, 10);
    expect(onValueChange).not.toHaveBeenCalled();
    await layout(spectrum, 200, 100);
    await touch(spectrum, 'responderGrant', 100, 0);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0000FF');
    await touch(spectrum, 'responderMove', 0, 50);
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFFFFFF');
    await touch(spectrum, 'responderMove', 200, 100);
    expect(onValueChange).toHaveBeenLastCalledWith('#000000FF');
  });

  it('drives the channel sliders, value fields and hex field', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={onValueChange} onClose={vi.fn()}/>);
    await fireEvent.press(screen.getByLabelText('Sliders tab'));
    expect(screen.queryByLabelText('Spectrum')).toBeNull();
    const red = screen.getByLabelText('Red');
    expect(red.props.accessibilityValue).toEqual({min: 0, max: 100, now: 100});
    await touch(red, 'responderGrant', 100);
    expect(onValueChange).not.toHaveBeenCalled();
    // Track 236: 4 inset + 28 thumb → 200 of travel; x=118 → 100/200.
    await layout(red, 236);
    await touch(red, 'responderGrant', 118);
    expect(onValueChange).toHaveBeenLastCalledWith('#806347FF');
    await touch(red, 'responderMove', 500);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF6347FF');

    const green = screen.getByLabelText('Green value');
    await fireEvent.changeText(green, '300');
    await fireEvent(green, 'blur');
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFF47FF');
    await fireEvent.changeText(green, 'abc');
    await fireEvent(green, 'submitEditing');
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0047FF');

    const hex = screen.getByLabelText('Hex color');
    expect(hex.props.value).toBe('FF0047');
    await fireEvent.changeText(hex, 'zzz');
    await fireEvent(hex, 'blur');
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0047FF');
    await fireEvent.changeText(hex, '0a0');
    await fireEvent(hex, 'blur');
    expect(onValueChange).toHaveBeenLastCalledWith('#00AA00FF');
  });

  it('drives the opacity slider and percent field', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={onValueChange} onClose={vi.fn()}/>);
    const opacity = screen.getByLabelText('Opacity');
    await layout(opacity, 236);
    await touch(opacity, 'responderGrant', 18);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634700');
    await touch(opacity, 'responderMove', 118);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634780');
    const percent = screen.getByLabelText('Opacity percent');
    await fireEvent.changeText(percent, '50');
    await fireEvent(percent, 'blur');
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634780');
    await fireEvent.changeText(percent, 'x');
    await fireEvent(percent, 'blur');
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634700');
  });

  it('saves the current color and reapplies it from the saved swatches', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPickerSheet title="Accent" value="#123456" supportsOpacity onValueChange={onValueChange} onClose={vi.fn()}/>);
    await fireEvent.press(screen.getByLabelText('Save color'));
    await fireEvent.press(screen.getByLabelText('Color #000000'));
    expect(onValueChange).toHaveBeenLastCalledWith('#000000FF');
    await fireEvent.press(screen.getByLabelText('Saved color #123456FF'));
    expect(onValueChange).toHaveBeenLastCalledWith('#123456FF');
  });

  it('raises the selected tab on a dark surface in the dark scheme', async () => {
    await act(() => setColorScheme('dark'));
    try {
      await render(<ColorPickerSheet title="Accent" value="#FF6347" supportsOpacity onValueChange={vi.fn()} onClose={vi.fn()}/>);
      const tab = screen.getByLabelText('Grid tab');
      expect(JSON.stringify(tab.props.style)).toContain('#636366');
    } finally {
      await act(() => setColorScheme('light'));
    }
  });
});
