import {columnsFor, rowsOf} from './shared';

describe('columnsFor', () => {
  it('fits as many cells of the minimum as the width holds, with the gap between them', () => {
    // Four cells of 150 and three gaps of 12 are 636.
    expect(columnsFor(636, 150, 4, 12)).toBe(4);
    expect(columnsFor(635, 150, 4, 12)).toBe(3);
    expect(columnsFor(390, 150, 4, 12)).toBe(2);
  });

  it('never goes under one column or over the cap', () => {
    expect(columnsFor(100, 150, 4, 12)).toBe(1);
    expect(columnsFor(0, 150, 4, 12)).toBe(1);
    expect(columnsFor(2000, 150, 3, 12)).toBe(3);
  });
});

describe('rowsOf', () => {
  it('cuts the cells into rows, the last one short', () => {
    expect(rowsOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(rowsOf([], 3)).toEqual([]);
  });
});
