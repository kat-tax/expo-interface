import {fireEvent, render, screen} from '@testing-library/react';
import {SegmentedControl} from '.';

const items = [
  <SegmentedControl.Item key="day" label="Day" value="day"/>,
  <SegmentedControl.Item key="week" label="Week" value="week"/>,
  <SegmentedControl.Item key="month" label="Month" value="month"/>,
];

const radio = (name: string) => screen.getByRole('radio', {name});

describe('SegmentedControl (web)', () => {
  it('renders a labelled radiogroup of native buttons', () => {
    render(
      <SegmentedControl label="Range" selectedValue="week" onValueChange={jest.fn()} testID="range">
        {items}
      </SegmentedControl>,
    );
    const group = screen.getByRole('radiogroup', {name: 'Range'});
    expect(group).toHaveClass('ui-segmented__group');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(radio('Day')).toHaveAttribute('type', 'button');
    expect(radio('Day')).toHaveClass('ui-segmented__item');
    expect(radio('Day')).toHaveAttribute('aria-checked', 'false');
    expect(radio('Week')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Month')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Range')).toBeInTheDocument();
    const row = screen.getByTestId('range');
    expect(row).toHaveClass('ui-segmented');
    expect(row).not.toHaveClass('ui-segmented--disabled');
  });

  it('reports the selected value and stays controlled', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl selectedValue="day" onValueChange={onValueChange}>{items}</SegmentedControl>,
    );
    fireEvent.click(radio('Month'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('month');
    expect(radio('Day')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Month')).toHaveAttribute('aria-checked', 'false');
  });

  it('manages its own selection when uncontrolled, seeded with the first item', () => {
    const onValueChange = jest.fn();
    render(<SegmentedControl onValueChange={onValueChange}>{items}</SegmentedControl>);
    expect(radio('Day')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(radio('Week'));
    expect(onValueChange).toHaveBeenCalledWith('week');
    expect(radio('Day')).toHaveAttribute('aria-checked', 'false');
    expect(radio('Week')).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps numeric values typed', () => {
    const onValueChange = jest.fn();
    render(
      <SegmentedControl selectedValue={2} onValueChange={onValueChange}>
        <SegmentedControl.Item label="One" value={1}/>
        <SegmentedControl.Item label="Two" value={2}/>
      </SegmentedControl>,
    );
    expect(radio('Two')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(radio('One'));
    expect(onValueChange).toHaveBeenCalledWith(1);
  });

  it('disables every segment and marks the row', () => {
    render(
      <SegmentedControl label="Range" disabled onValueChange={jest.fn()} testID="range">{items}</SegmentedControl>,
    );
    for (const button of screen.getAllByRole('radio')) expect(button).toBeDisabled();
    expect(screen.getByTestId('range')).toHaveClass('ui-segmented--disabled');
  });

  it('colors only the selected segment with a custom accent', () => {
    render(
      <SegmentedControl selectedValue="week" accentColor="#FF9500" onValueChange={jest.fn()}>{items}</SegmentedControl>,
    );
    expect(radio('Week')).toHaveStyle({color: '#FF9500'});
    expect(radio('Day').style.color).toBe('');
  });

  it('omits the label text and accessible name without a label', () => {
    render(<SegmentedControl testID="bare">{items}</SegmentedControl>);
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
    expect(screen.getByTestId('bare').querySelector('span')).toBeNull();
  });

  it('ignores children that are not items', () => {
    render(
      <SegmentedControl>
        {items}
        <span>ignored</span>
        {null}
      </SegmentedControl>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('flattens the row style into inline CSS', () => {
    render(<SegmentedControl style={{opacity: 0.5}} testID="styled">{items}</SegmentedControl>);
    expect(screen.getByTestId('styled')).toHaveStyle({opacity: 0.5});
  });
});
