import {act, fireEvent, render, screen, within} from '@testing-library/react';
import {ColorPicker} from '.';

/** Opens the picker sheet from the row and returns its dialog. */
function open() {
  fireEvent.click(document.querySelector('.ui-color-picker') as HTMLElement);
  return screen.getByRole('dialog');
}

/**
 * react-native-web fires `onLayout` from a `ResizeObserver`, which jsdom lacks;
 * this stub records the observer callback so a test can lay a node out with
 * the size it wants (measured through `getBoundingClientRect`).
 */
let observe: ((entries: {target: Element}[]) => void) | undefined;
class ResizeObserverStub {
  constructor(callback: typeof observe) {
    observe = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
// react-native-web reads the constructor from `window`, not `globalThis`.
Object.assign(window, {ResizeObserver: ResizeObserverStub});
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const layout = async (element: Element, width: number, height = 40) => {
  // `UIManager.measure` reads the offset metrics (in a timeout) and the
  // responder reads `getBoundingClientRect`; jsdom leaves both at 0.
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height}),
  });
  for (const [key, value] of Object.entries({offsetWidth: width, offsetHeight: height, offsetLeft: 0, offsetTop: 0})) {
    Object.defineProperty(element, key, {configurable: true, value});
  }
  await act(async () => {
    observe?.([{target: element}]);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

describe('ColorPicker (web)', () => {
  it('renders a labelled button row with the selected color in the well', () => {
    render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>);
    const button = screen.getByRole('button', {name: 'Accent'});
    expect(button).toBe(screen.getByTestId('cp'));
    expect(button).toHaveClass('ui-color-picker');
    expect(button).not.toHaveClass('ui-color-picker--disabled');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.style.getPropertyValue('--ui-color-picker-value')).toBe('rgba(255, 99, 71, 1)');
    expect(button.querySelector('.ui-color-picker__well .ui-color-picker__swatch')).not.toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('names a bare well "Color"', () => {
    render(<ColorPicker value="#000000" onValueChange={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Color'})).toBeInTheDocument();
  });

  it('disables the row', () => {
    render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} disabled testID="cp"/>);
    const button = screen.getByRole('button', {name: 'Accent'});
    expect(button).toBeDisabled();
    expect(button).toHaveClass('ui-color-picker--disabled');
  });

  it('flattens the row style into inline CSS', () => {
    render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} style={{opacity: 0.5}} testID="cp"/>);
    expect(screen.getByTestId('cp').style.opacity).toBe('0.5');
  });

  it('opens the picker sheet titled after the label and closes it from the close button', () => {
    render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>);
    const dialog = open();
    // The drawer hides the rest of the page from assistive technology while open.
    expect(screen.getByTestId('cp')).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('heading', {name: 'Accent'})).toBeInTheDocument();
    expect(screen.getByTestId('cp-sheet')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', {name: 'Close'}));
    expect(screen.getByTestId('cp')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the drawer is dismissed', () => {
    render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>);
    const dialog = open();
    fireEvent.keyDown(dialog, {key: 'Escape'});
    expect(screen.getByTestId('cp')).toHaveAttribute('aria-expanded', 'false');
  });

  it('titles the sheet "Colors" without a label and hides the opacity slider when unsupported', () => {
    render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} supportsOpacity={false}/>);
    const dialog = open();
    expect(within(dialog).getByRole('heading', {name: 'Colors'})).toBeInTheDocument();
    expect(within(dialog).queryByRole('slider', {name: 'Opacity'})).toBeNull();
  });

  it('picks a grid color and reports it as #RRGGBBAA', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker label="Accent" value="#FF634780" onValueChange={onValueChange} testID="cp"/>);
    const dialog = open();
    const white = within(dialog).getByRole('button', {name: 'Color #FFFFFF'});
    fireEvent.click(white);
    // The alpha channel is kept when picking from the grid.
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFFFF80');
    expect(white).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('cp').style.getPropertyValue('--ui-color-picker-value')).toBe('rgba(255, 255, 255, 0.502)');
  });

  it('reports #RRGGBB and forces full opacity when opacity is unsupported', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#FF634780" onValueChange={onValueChange} supportsOpacity={false}/>);
    const dialog = open();
    fireEvent.click(within(dialog).getByRole('button', {name: 'Color #000000'}));
    expect(onValueChange).toHaveBeenLastCalledWith('#000000');
  });

  it('follows a new value from the parent', () => {
    const {rerender} = render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} testID="cp"/>);
    rerender(<ColorPicker value="#00FF00" onValueChange={vi.fn()} testID="cp"/>);
    expect(screen.getByTestId('cp').style.getPropertyValue('--ui-color-picker-value')).toBe('rgba(0, 255, 0, 1)');
  });

  it('switches between the Grid, Spectrum and Sliders tabs', () => {
    render(<ColorPicker value="#FF6347" onValueChange={vi.fn()}/>);
    const dialog = open();
    const tabs = within(dialog).getAllByRole('radio');
    expect(tabs.map(tab => tab.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    fireEvent.click(tabs[1]);
    expect(within(dialog).getByRole('slider', {name: 'Spectrum'})).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', {name: 'Color #FFFFFF'})).toBeNull();
    fireEvent.click(tabs[2]);
    expect(within(dialog).getByRole('slider', {name: 'Red'})).toBeInTheDocument();
    expect(within(dialog).queryByRole('slider', {name: 'Spectrum'})).toBeNull();
    fireEvent.click(tabs[0]);
    expect(within(dialog).getByRole('button', {name: 'Color #FFFFFF'})).toBeInTheDocument();
  });

  it('picks from the spectrum once it has a size', async () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#FF6347" onValueChange={onValueChange}/>);
    const dialog = open();
    fireEvent.click(within(dialog).getAllByRole('radio')[1]);
    const spectrum = within(dialog).getByRole('slider', {name: 'Spectrum'});
    // Before layout the pick is ignored.
    fireEvent.mouseDown(spectrum, {clientX: 10, clientY: 10});
    expect(onValueChange).not.toHaveBeenCalled();
    await layout(spectrum, 200, 100);
    fireEvent.mouseDown(spectrum, {clientX: 100, clientY: 0});
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0000FF');
    fireEvent.mouseMove(spectrum, {clientX: 200, clientY: 50});
    expect(onValueChange).toHaveBeenLastCalledWith('#000000FF');
  });

  it('drives the channel sliders, value fields and hex field', async () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#FF6347" onValueChange={onValueChange}/>);
    const dialog = open();
    fireEvent.click(within(dialog).getAllByRole('radio')[2]);
    const red = within(dialog).getByRole('slider', {name: 'Red'});
    fireEvent.mouseDown(red, {clientX: 100});
    expect(onValueChange).not.toHaveBeenCalled();
    await layout(red, 236);
    // Track 236: 4px inset + 28px thumb → 200px of travel; x=118 → 100/200.
    fireEvent.mouseDown(red, {clientX: 118});
    expect(onValueChange).toHaveBeenLastCalledWith('#806347FF');
    fireEvent.mouseMove(red, {clientX: 500});
    expect(onValueChange).toHaveBeenLastCalledWith('#FF6347FF');

    const green = within(dialog).getByRole('textbox', {name: 'Green value'});
    fireEvent.change(green, {target: {value: '300'}});
    fireEvent.blur(green);
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFF47FF');
    fireEvent.change(green, {target: {value: 'abc'}});
    fireEvent.keyDown(green, {key: 'Enter'});
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0047FF');

    const hex = within(dialog).getByRole('textbox', {name: 'Hex color'});
    expect(hex).toHaveValue('FF0047');
    fireEvent.change(hex, {target: {value: 'zzz'}});
    fireEvent.blur(hex);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF0047FF');
    fireEvent.change(hex, {target: {value: '0a0'}});
    fireEvent.blur(hex);
    expect(onValueChange).toHaveBeenLastCalledWith('#00AA00FF');
  });

  it('drives the opacity slider and percent field', async () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#FF6347" onValueChange={onValueChange}/>);
    const dialog = open();
    const opacity = within(dialog).getByRole('slider', {name: 'Opacity'});
    await layout(opacity, 236);
    fireEvent.mouseDown(opacity, {clientX: 18});
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634700');
    const percent = within(dialog).getByRole('textbox', {name: 'Opacity percent'});
    fireEvent.change(percent, {target: {value: '50'}});
    fireEvent.blur(percent);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634780');
    fireEvent.change(percent, {target: {value: 'x'}});
    fireEvent.blur(percent);
    expect(onValueChange).toHaveBeenLastCalledWith('#FF634700');
  });

  it('saves the current color and reapplies it from the saved swatches', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#123456" onValueChange={onValueChange}/>);
    const dialog = open();
    fireEvent.click(within(dialog).getByRole('button', {name: 'Save color'}));
    fireEvent.click(within(dialog).getByRole('button', {name: 'Color #000000'}));
    expect(onValueChange).toHaveBeenLastCalledWith('#000000FF');
    fireEvent.click(within(dialog).getByRole('button', {name: 'Saved color #123456FF'}));
    expect(onValueChange).toHaveBeenLastCalledWith('#123456FF');
  });
});
