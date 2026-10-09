import {Platform, StyleSheet} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {setColorScheme} from 'vitest-native/helpers';
import {nodes} from 'expo-vitest/native';
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

  it('draws a title row only for a title or a close button', async () => {
    // The sheet's first child: the title row when there is one, the tabs when there is none.
    const first = () => screen.getByTestId('sheet').children[0];
    const {rerender} = await render(<ColorPickerSheet value="#FF6347" supportsOpacity onValueChange={vi.fn()} testID="sheet"/>);
    expect(first()).toBe(screen.getByLabelText('Picker'));
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByLabelText('Close')).toBeNull();
    await rerender(<ColorPickerSheet title="Ink" value="#FF6347" supportsOpacity onValueChange={vi.fn()} testID="sheet"/>);
    expect(first()).not.toBe(screen.getByLabelText('Picker'));
    expect(screen.getByTestId('sheet').children[1]).toBe(screen.getByLabelText('Picker'));
    expect(screen.getByRole('heading', {name: 'Ink'}).parent).toBe(first());
    expect(screen.queryByLabelText('Close')).toBeNull();
    const onClose = vi.fn();
    await rerender(<ColorPickerSheet value="#FF6347" supportsOpacity onValueChange={vi.fn()} onClose={onClose} testID="sheet"/>);
    expect(screen.queryByRole('heading')).toBeNull();
    // A close button alone keeps the row.
    expect(screen.getByLabelText('Close').parent).toBe(first());
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
    // The grant returns true, which keeps the native parents (Compose's sheet
    // around an inline picker) from intercepting the drag.
    expect(await touch(spectrum, 'responderGrant', 100, 0)).toBe(true);
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
    expect(await touch(red, 'responderGrant', 118)).toBe(true);
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

  it('dims itself and takes no pick when disabled, the close button aside', async () => {
    const onValueChange = vi.fn();
    const onClose = vi.fn();
    const sheet = (disabled: boolean) => (
      <ColorPickerSheet title="Ink" value="#123456" supportsOpacity disabled={disabled} onValueChange={onValueChange} onClose={onClose} testID="sheet"/>
    );
    const {rerender} = await render(sheet(false));
    expect(StyleSheet.flatten(screen.getByTestId('sheet').props.style).opacity).toBeUndefined();
    await fireEvent.press(screen.getByLabelText('Save color'));
    const saved = screen.getAllByLabelText(/^Saved color/).length;
    await rerender(sheet(true));
    expect(StyleSheet.flatten(screen.getByTestId('sheet').props.style).opacity).toBe(0.4);
    // The grid, the tabs and the saved colors are disabled buttons.
    const white = screen.getByLabelText('Color #FFFFFF');
    expect(white.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(white);
    await fireEvent.press(screen.getByLabelText('Sliders tab'));
    expect(screen.getByLabelText('Grid tab').props.accessibilityState).toMatchObject({checked: true, disabled: true});
    await fireEvent.press(screen.getAllByLabelText(/^Saved color/)[0]);
    await fireEvent.press(screen.getByLabelText('Save color'));
    expect(screen.getAllByLabelText(/^Saved color/)).toHaveLength(saved);
    // The opacity slider never takes the touch, and its field cannot be edited.
    const opacity = screen.getByLabelText('Opacity');
    expect(opacity.props.accessibilityState.disabled).toBe(true);
    expect(opacity.props.onStartShouldSetResponder()).toBe(false);
    expect(opacity.props.onMoveShouldSetResponder()).toBe(false);
    await layout(opacity, 236);
    await touch(opacity, 'responderGrant', 18);
    const percent = screen.getByLabelText('Opacity percent');
    expect(percent.props.editable).toBe(false);
    expect(percent.props['aria-disabled']).toBe(true);
    // The spectrum and the channel sliders, reached while enabled, are as still.
    for (const tab of ['Spectrum', 'Sliders']) {
      await rerender(sheet(false));
      await fireEvent.press(screen.getByLabelText(`${tab} tab`));
      await rerender(sheet(true));
      const surface = screen.getByLabelText(tab === 'Spectrum' ? 'Spectrum' : 'Red');
      expect(surface.props.accessibilityState.disabled).toBe(true);
      expect(surface.props.onStartShouldSetResponder()).toBe(false);
    }
    expect(screen.getByLabelText('Hex color').props.editable).toBe(false);
    expect(screen.getByLabelText('Green value').props.editable).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
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
