import {fireEvent, render, screen, within} from '@testing-library/react';
import {ColorPicker} from '.';

describe('ColorPicker presentations (web)', () => {
  it('draws the platform\'s palette for system swatches', () => {
    render(<ColorPicker value="#007AFF" swatches="system" onValueChange={vi.fn()}/>);
    expect(screen.getAllByRole('button', {name: /^Color /})).toHaveLength(12);
    expect(screen.getByRole('button', {name: 'Color Blue'})).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers No color, reports it as an empty value, and crosses out the well for it', () => {
    const onValueChange = vi.fn();
    const {rerender} = render(<ColorPicker label="Fill" value="#FF0000" allowsNone onValueChange={onValueChange} testID="cp"/>);
    const none = screen.getByRole('button', {name: 'No color'});
    expect(none).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('cp').querySelector('.ui-color-picker__well--none')).toBeNull();
    fireEvent.click(none);
    expect(onValueChange).toHaveBeenLastCalledWith('');
    rerender(<ColorPicker label="Fill" value="" allowsNone onValueChange={onValueChange} testID="cp"/>);
    expect(screen.getByRole('button', {name: 'No color'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('cp').querySelector('.ui-color-picker__well--none')).not.toBeNull();
  });

  it('draws the picker in place, with no close button, the presets over it, titled only by a label', () => {
    const {rerender} = render(<ColorPicker label="Ink" value="#FF0000" presentation="inline" swatches={['#FF0000']} onValueChange={vi.fn()} testID="cp"/>);
    const inline = screen.getByTestId('cp');
    expect(inline).toHaveClass('ui-color-picker-inline');
    expect(inline.contains(screen.getByTestId('cp-sheet'))).toBe(true);
    expect(within(inline).getByRole('heading', {name: 'Ink'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Close'})).toBeNull();
    expect(inline.querySelector('.ui-color-picker__presets--inline')).not.toBeNull();
    rerender(<ColorPicker value="#FF0000" presentation="inline" onValueChange={vi.fn()} testID="cp"/>);
    expect(screen.getByTestId('cp').querySelector('.ui-color-picker__presets')).toBeNull();
    // Without a label the picker adds no heading under the sheet it sits in.
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('disables the picker drawn in place along with its presets', () => {
    const onValueChange = vi.fn();
    const {rerender} = render(<ColorPicker value="#FF0000" presentation="inline" swatches={['#FF0000']} onValueChange={onValueChange} testID="cp"/>);
    const sheet = () => screen.getByTestId('cp-sheet');
    expect(getComputedStyle(sheet()).opacity).not.toBe('0.4');
    expect(within(sheet()).getByRole('button', {name: 'Color #FFFFFF'})).not.toHaveAttribute('aria-disabled');
    rerender(<ColorPicker value="#FF0000" presentation="inline" swatches={['#FF0000']} disabled onValueChange={onValueChange} testID="cp"/>);
    expect(getComputedStyle(sheet()).opacity).toBe('0.4');
    const white = within(sheet()).getByRole('button', {name: 'Color #FFFFFF'});
    expect(white).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(white);
    expect(within(sheet()).getByRole('radio', {name: 'Sliders tab'})).toHaveAttribute('aria-disabled', 'true');
    expect(within(sheet()).getByRole('slider', {name: 'Opacity'})).toHaveAttribute('aria-disabled', 'true');
    expect(within(sheet()).getByRole('textbox', {name: 'Opacity percent'})).toHaveAttribute('readonly');
    expect(within(sheet()).getByRole('button', {name: 'Save color'})).toHaveAttribute('aria-disabled', 'true');
    const preset = screen.getByTestId('cp').querySelector<HTMLButtonElement>('.ui-color-picker__presets .ui-color-picker__preset')!;
    expect(preset).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('opens the picker in a native popover from the well, and closes it from its close button', () => {
    const {rerender} = render(<ColorPicker label="Ink" value="#FF0000" presentation="popover" onValueChange={vi.fn()} testID="cp"/>);
    const popover = document.querySelector<HTMLElement>('.ui-color-picker__popover')!;
    expect(popover).toHaveAttribute('popover', 'auto');
    expect(screen.getByTestId('cp')).toHaveAttribute('popovertarget', popover.id);
    expect(screen.getByTestId('cp')).toHaveAttribute('aria-haspopup', 'dialog');
    // A popover's picker keeps its title.
    expect(within(popover).getByRole('heading', {name: 'Ink', hidden: true})).toBeInTheDocument();
    const hide = vi.fn();
    popover.hidePopover = hide;
    fireEvent.click(within(popover).getByRole('button', {name: 'Close', hidden: true}));
    expect(hide).toHaveBeenCalledTimes(1);
    // With presets, the well of its own opens it.
    rerender(<ColorPicker label="Ink" value="#FF0000" presentation="popover" swatches={['#FF0000']} onValueChange={vi.fn()} testID="cp"/>);
    const again = document.querySelector<HTMLElement>('.ui-color-picker__popover')!;
    expect(screen.getByRole('button', {name: 'Ink'})).toHaveAttribute('popovertarget', again.id);
  });

  it('opens a menu of the swatches from the well, No color first', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker label="Ink" value="#FF3B30" presentation="menu" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>);
    const well = screen.getByRole('button', {name: 'Ink'});
    expect(well).toHaveAttribute('aria-haspopup', 'menu');
    const items = screen.getAllByRole('menuitem', {hidden: true});
    // No color, then the twelve system colors, the current one checked.
    expect(items).toHaveLength(13);
    expect(items[0]).toHaveTextContent('No color');
    expect(items[1]).toHaveTextContent('Red');
    expect(well).toHaveAttribute('popovertarget', items[0].closest('[popover]')!.id);
    fireEvent.click(screen.getByRole('menuitem', {name: /Blue/, hidden: true}));
    expect(onValueChange).toHaveBeenLastCalledWith('#007AFFFF');
  });

  it('names its own swatches as given, in the row and in a menu', () => {
    const onValueChange = vi.fn();
    const swatches = [{color: '#1D1D1F', name: 'Ink'}, '#FF0000'];
    const {rerender} = render(<ColorPicker value="#FF0000" swatches={swatches} onValueChange={onValueChange}/>);
    expect(screen.getByRole('button', {name: 'Color Ink'})).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', {name: 'Color #FF0000'})).toHaveAttribute('aria-pressed', 'true');
    rerender(<ColorPicker label="Ink" value="#FF0000" presentation="menu" swatches={swatches} onValueChange={onValueChange}/>);
    const items = screen.getAllByRole('menuitem', {hidden: true});
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/^Ink$/);
    // The current one carries its check.
    expect(items[1]).toHaveTextContent(/^#FF0000✓$/);
    fireEvent.click(items[0]);
    expect(onValueChange).toHaveBeenLastCalledWith('#1D1D1FFF');
  });

  it('names a menu well without a label Color', () => {
    render(<ColorPicker value="" presentation="menu" onValueChange={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Color'})).toHaveAttribute('aria-haspopup', 'menu');
  });
});
