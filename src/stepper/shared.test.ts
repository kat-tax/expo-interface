import {clampStep, stepBounds} from './shared';

const noop = () => {};

describe('clampStep', () => {
  it('returns the value untouched when there are no bounds', () => {
    expect(clampStep(5)).toBe(5);
    expect(clampStep(-3)).toBe(-3);
  });

  it('clamps into [min, max]', () => {
    expect(clampStep(-1, 0, 10)).toBe(0);
    expect(clampStep(11, 0, 10)).toBe(10);
    expect(clampStep(5, 0, 10)).toBe(5);
  });

  it('honours a single bound', () => {
    expect(clampStep(-1, 0)).toBe(0);
    expect(clampStep(99, 0)).toBe(99);
    expect(clampStep(99, undefined, 10)).toBe(10);
    expect(clampStep(-99, undefined, 10)).toBe(-99);
  });

  it('rounds away float drift from repeated fractional steps', () => {
    expect(clampStep(0.1 + 0.2)).toBe(0.3);
    expect(clampStep(1.1 + 0.1 + 0.1 + 0.1 + 0.1)).toBe(1.5);
    expect(clampStep(0.3 - 0.1)).toBe(0.2);
  });

  it('keeps up to six decimal places', () => {
    expect(clampStep(1.2345678)).toBe(1.234568);
    expect(clampStep(0.000001)).toBe(0.000001);
  });
});

describe('stepBounds', () => {
  it('allows both directions without bounds', () => {
    expect(stepBounds({value: 0, onValueChange: noop})).toEqual({canDecrement: true, canIncrement: true});
  });

  it('disables the decrement button at min', () => {
    expect(stepBounds({value: 1, min: 1, max: 5, onValueChange: noop})).toEqual({
      canDecrement: false,
      canIncrement: true,
    });
  });

  it('disables the increment button at max', () => {
    expect(stepBounds({value: 5, min: 1, max: 5, onValueChange: noop})).toEqual({
      canDecrement: true,
      canIncrement: false,
    });
  });

  it('disables both when min equals max', () => {
    expect(stepBounds({value: 3, min: 3, max: 3, onValueChange: noop})).toEqual({
      canDecrement: false,
      canIncrement: false,
    });
  });

  it('treats values beyond the bounds as pinned', () => {
    expect(stepBounds({value: -1, min: 0, onValueChange: noop}).canDecrement).toBe(false);
    expect(stepBounds({value: 11, max: 10, onValueChange: noop}).canIncrement).toBe(false);
  });

  it('disables both directions when disabled', () => {
    expect(stepBounds({value: 3, min: 0, max: 10, disabled: true, onValueChange: noop})).toEqual({
      canDecrement: false,
      canIncrement: false,
    });
  });
});
