import {fireEvent, render, screen} from '@testing-library/react';
import {Picker} from '.';

const items = [
  <Picker.Item key="s" label="Small" value="s"/>,
  <Picker.Item key="m" label="Medium" value="m"/>,
  <Picker.Item key="l" label="Large" value="l"/>,
];

const select = () => screen.getByRole('combobox') as HTMLSelectElement;

describe('Picker (web)', () => {
  it('renders a labelled native <select> over the value pill', () => {
    render(<Picker label="Size" selectedValue="m" onValueChange={vi.fn()} testID="size">{items}</Picker>);
    const control = screen.getByRole('combobox', {name: 'Size'});
    expect(control.tagName).toBe('SELECT');
    expect(control).toHaveValue('m');
    expect(control).toBeEnabled();
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map(o => o.textContent)).toEqual(['Small', 'Medium', 'Large']);
    expect(options.map(o => o.value)).toEqual(['s', 'm', 'l']);
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByTestId('size').contains(control)).toBe(true);
  });

  it('shows the selected item label inside the pill', () => {
    const {rerender} = render(<Picker selectedValue="m">{items}</Picker>);
    expect(screen.getByText('Medium', {selector: 'span'})).toBeInTheDocument();
    expect(screen.queryByText('Small', {selector: 'span'})).toBeNull();
    rerender(<Picker selectedValue="l">{items}</Picker>);
    expect(select()).toHaveValue('l');
    expect(screen.getByText('Large', {selector: 'span'})).toBeInTheDocument();
  });

  it('reports the selected value and stays controlled', () => {
    const onValueChange = vi.fn();
    render(<Picker selectedValue="s" onValueChange={onValueChange}>{items}</Picker>);
    fireEvent.change(select(), {target: {value: 'l'}});
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('l');
    expect(select()).toHaveValue('s');
  });

  it('manages its own selection when uncontrolled, seeded with the first item', () => {
    const onValueChange = vi.fn();
    render(<Picker onValueChange={onValueChange}>{items}</Picker>);
    expect(select()).toHaveValue('s');
    fireEvent.change(select(), {target: {value: 'm'}});
    expect(onValueChange).toHaveBeenCalledWith('m');
    expect(select()).toHaveValue('m');
    expect(screen.getAllByText('Medium')).toHaveLength(2);
  });

  it('keeps numeric values typed', () => {
    const onValueChange = vi.fn();
    render(
      <Picker selectedValue={15} onValueChange={onValueChange}>
        <Picker.Item label="5 minutes" value={5}/>
        <Picker.Item label="15 minutes" value={15}/>
        <Picker.Item label="1 hour" value={60}/>
      </Picker>,
    );
    expect(select()).toHaveValue('15');
    fireEvent.change(select(), {target: {value: '60'}});
    expect(onValueChange).toHaveBeenCalledWith(60);
  });

  it('disables the select and dims the row', () => {
    const onValueChange = vi.fn();
    render(<Picker label="Size" selectedValue="m" onValueChange={onValueChange} disabled>{items}</Picker>);
    expect(select()).toBeDisabled();
    expect(select().style.cursor).toBe('default');
    expect(screen.getByText('Size')).toHaveStyle({opacity: 0.4});
  });

  it('colors the value with a custom accent', () => {
    render(<Picker selectedValue="m" accentColor="#FF9500">{items}</Picker>);
    const pill = screen.getByText('Medium', {selector: 'span'});
    expect(pill).toHaveStyle({color: '#FF9500'});
  });

  it('falls back to a generic accessible name without a label', () => {
    render(<Picker selectedValue="m" testID="bare">{items}</Picker>);
    expect(screen.getByRole('combobox', {name: 'Select option'})).toBeInTheDocument();
    expect(screen.getByTestId('bare').querySelectorAll('span')).toHaveLength(1);
  });

  it('ignores children that are not items and renders an empty pill without any', () => {
    const {rerender} = render(
      <Picker selectedValue="m">
        {items}
        <span>ignored</span>
        {false}
      </Picker>,
    );
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.queryByText('ignored')).toBeNull();
    rerender(<Picker/>);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(select()).not.toHaveValue();
  });
});
