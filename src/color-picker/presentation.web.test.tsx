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

  it('draws the picker in place, with no close button, the presets over it', () => {
    const {rerender} = render(<ColorPicker label="Ink" value="#FF0000" presentation="inline" swatches={['#FF0000']} onValueChange={vi.fn()} testID="cp"/>);
    const inline = screen.getByTestId('cp');
    expect(inline).toHaveClass('ui-color-picker-inline');
    expect(inline.contains(screen.getByTestId('cp-sheet'))).toBe(true);
    expect(screen.queryByRole('button', {name: 'Close'})).toBeNull();
    expect(inline.querySelector('.ui-color-picker__presets--inline')).not.toBeNull();
    rerender(<ColorPicker value="#FF0000" presentation="inline" onValueChange={vi.fn()} testID="cp"/>);
    expect(screen.getByTestId('cp').querySelector('.ui-color-picker__presets')).toBeNull();
  });

  it('opens the picker in a native popover from the well, and closes it from its close button', () => {
    const {rerender} = render(<ColorPicker label="Ink" value="#FF0000" presentation="popover" onValueChange={vi.fn()} testID="cp"/>);
    const popover = document.querySelector<HTMLElement>('.ui-color-picker__popover')!;
    expect(popover).toHaveAttribute('popover', 'auto');
    expect(screen.getByTestId('cp')).toHaveAttribute('popovertarget', popover.id);
    expect(screen.getByTestId('cp')).toHaveAttribute('aria-haspopup', 'dialog');
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

  it('names a menu well without a label Color', () => {
    render(<ColorPicker value="" presentation="menu" onValueChange={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Color'})).toHaveAttribute('aria-haspopup', 'menu');
  });
});
