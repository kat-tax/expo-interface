import {createElement} from 'react';
import {extractItems, labelFor, PickerItem} from './shared';

const item = (label: string, value: string | number) => createElement(PickerItem, {label, value, key: String(value)});

describe('PickerItem', () => {
  it('renders nothing itself', () => {
    expect(PickerItem({label: 'Small', value: 's'})).toBeNull();
  });
});

describe('extractItems', () => {
  it('reads label and value from each item child', () => {
    expect(extractItems([item('Small', 's'), item('Medium', 'm')])).toEqual([
      {label: 'Small', value: 's'},
      {label: 'Medium', value: 'm'},
    ]);
  });

  it('keeps numeric values typed', () => {
    expect(extractItems([item('Five', 5), item('Ten', 10)])).toEqual([
      {label: 'Five', value: 5},
      {label: 'Ten', value: 10},
    ]);
  });

  it('flattens nested arrays and ignores non-item children', () => {
    const children = [
      [item('A', 'a'), item('B', 'b')],
      createElement('span', null, 'ignored'),
      'text',
      null,
      false,
      undefined,
      item('C', 'c'),
    ];
    expect(extractItems(children).map(o => o.value)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list for empty children', () => {
    expect(extractItems(undefined)).toEqual([]);
    expect(extractItems(null)).toEqual([]);
    expect(extractItems([])).toEqual([]);
  });
});

describe('labelFor', () => {
  const options = [
    {label: 'Small', value: 's'},
    {label: 'Medium', value: 'm'},
  ];

  it('finds the label of the selected value', () => {
    expect(labelFor(options, 'm')).toBe('Medium');
  });

  it('returns an empty string for unknown or missing values', () => {
    expect(labelFor(options, 'xl')).toBe('');
    expect(labelFor(options, undefined)).toBe('');
    expect(labelFor([], 's')).toBe('');
  });

  it('matches values strictly by type', () => {
    const numeric = [{label: 'One', value: 1}];
    expect(labelFor(numeric, 1)).toBe('One');
    expect(labelFor<string | number>(numeric, '1')).toBe('');
  });
});
