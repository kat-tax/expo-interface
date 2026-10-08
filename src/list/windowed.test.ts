import {INITIAL_SPAN, OVERSCAN, rangeOf} from './windowed';

describe('rangeOf', () => {
  it('draws nothing of nothing', () => {
    expect(rangeOf([], 0, 0, 100)).toEqual({first: 0, end: 0, before: 0, after: 0});
  });

  it('draws the units that cover the span, and keeps the room of the rest', () => {
    const tens = Array.from({length: 10}, () => 50);
    // Unit 2 runs from 100 to 150, past 120; unit 6 starts at 300, past 260.
    expect(rangeOf(tens, 0, 120, 260)).toEqual({first: 2, end: 6, before: 100, after: 200});
  });

  it('counts the gap after each unit before the window and before each unit after it', () => {
    const fives = Array.from({length: 5}, () => 100);
    expect(rangeOf(fives, 10, 0, 150)).toEqual({first: 0, end: 2, before: 0, after: 330});
    // The span starts in the gap after unit 0: unit 1 is the first.
    expect(rangeOf(fives, 10, 105, 150)).toEqual({first: 1, end: 2, before: 110, after: 330});
  });

  it('draws the last unit when the span is past the end, and the first when it is above the start', () => {
    const fives = Array.from({length: 5}, () => 50);
    expect(rangeOf(fives, 0, 1000, 2000)).toEqual({first: 4, end: 5, before: 200, after: 0});
    expect(rangeOf(fives, 0, -500, -100)).toEqual({first: 0, end: 1, before: 0, after: 200});
  });

  it('takes each unit at its own height', () => {
    expect(rangeOf([10, 200, 10, 10], 0, 50, 220)).toEqual({first: 1, end: 3, before: 10, after: 10});
  });

  it('draws a viewport beyond each edge, and 1200 px before anything is measured', () => {
    expect(OVERSCAN).toBe(1);
    expect(INITIAL_SPAN).toBe(1200);
  });
});
