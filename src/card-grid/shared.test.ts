import {capOf, columnsFor, rowsOf} from './shared';

describe('capOf', () => {
  it('counts a fraction down to a whole number, and anything under one as one', () => {
    expect(capOf(4)).toBe(4);
    expect(capOf(2.5)).toBe(2);
    expect(capOf(0.5)).toBe(1);
    expect(capOf(0)).toBe(1);
    expect(capOf(-2)).toBe(1);
  });
});

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

  it('caps at a whole number of columns, and at least one, whatever the cap it is given', () => {
    expect(columnsFor(2000, 150, 2.5, 12)).toBe(2);
    expect(columnsFor(2000, 150, 0, 12)).toBe(1);
    expect(columnsFor(2000, 150, -1, 12)).toBe(1);
  });
});

describe('rowsOf', () => {
  it('cuts the cells into rows, the last one short', () => {
    expect(rowsOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(rowsOf([], 3)).toEqual([]);
  });
});
