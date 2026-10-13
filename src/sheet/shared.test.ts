import {describe, expect, it} from 'vitest';
import {BAR_SIDE, BLUR_RADIUS, IOS_MATERIAL, MATERIAL_OPACITY, TITLE_ROOM, accessoryFits, barAccessory, barSide, contentPaddingEdges, fillsMaxHeight, hasMaterial, skipsPartiallyExpanded} from './shared';

describe('the material facts the sheet reads', () => {
  it('are the material module\'s', async () => {
    const material = await import('../material/shared');
    expect(BLUR_RADIUS).toBe(material.BLUR_RADIUS);
    expect(MATERIAL_OPACITY).toBe(material.MATERIAL_OPACITY);
    expect(IOS_MATERIAL).toBe(material.IOS_MATERIAL);
    expect(hasMaterial).toBe(material.hasMaterial);
  });
});

describe('contentPaddingEdges', () => {
  const fallback = {top: 0, bottom: 0, left: 16, right: 16};

  it('is the fallback when no padding is given', () => {
    expect(contentPaddingEdges(undefined, fallback)).toBe(fallback);
  });

  it('puts a number on every edge', () => {
    expect(contentPaddingEdges(8, fallback)).toEqual({top: 8, bottom: 8, left: 8, right: 8});
  });

  it('takes what an object says, and 0 for an edge it leaves out', () => {
    expect(contentPaddingEdges({top: 4}, fallback)).toEqual({top: 4, bottom: 0, left: 0, right: 0});
    expect(contentPaddingEdges({top: 1, bottom: 2, left: 3, right: 4}, fallback)).toEqual({top: 1, bottom: 2, left: 3, right: 4});
  });
});

describe('the states an Android sheet opens in', () => {
  it('skips the half-way stop without snap points, so a tall sheet opens whole', () => {
    expect(skipsPartiallyExpanded(undefined)).toBe(true);
    expect(skipsPartiallyExpanded([])).toBe(true);
  });

  it('keeps the stop for a snap point that asks for one: half, a fraction under 1, a height', () => {
    expect(skipsPartiallyExpanded(['half'])).toBe(false);
    expect(skipsPartiallyExpanded([{fraction: 0.4}, 'full'])).toBe(false);
    expect(skipsPartiallyExpanded([{height: 300}])).toBe(false);
    expect(skipsPartiallyExpanded(['full'])).toBe(true);
    expect(skipsPartiallyExpanded([{fraction: 1}])).toBe(true);
  });

  it('fills the window for a full snap point or a fraction of all of it, and fits its content otherwise', () => {
    expect(fillsMaxHeight(undefined)).toBe(false);
    expect(fillsMaxHeight([])).toBe(false);
    expect(fillsMaxHeight(['half'])).toBe(false);
    expect(fillsMaxHeight([{fraction: 0.5}])).toBe(false);
    expect(fillsMaxHeight([{height: 300}])).toBe(false);
    expect(fillsMaxHeight(['full'])).toBe(true);
    expect(fillsMaxHeight([{fraction: 1}])).toBe(true);
  });
});

describe('the accessory in the bar', () => {
  it('makes each end as wide as the wider end\'s content, never under the bar\'s side, counting a width not measured as none', () => {
    expect(barSide(undefined, undefined)).toBe(BAR_SIDE);
    expect(barSide(30, 50)).toBe(BAR_SIDE);
    expect(barSide(150, 60)).toBe(150);
    expect(barSide(30, 90)).toBe(90);
    expect(barSide(undefined, 90)).toBe(90);
  });

  it('sits in the bar while the titles keep at least their room between the two ends at the wider one\'s width', () => {
    expect(TITLE_ROOM).toBe(96);
    // 400 less two ends of 150 leaves 100 for the titles.
    expect(accessoryFits({bar: 400, leading: 150, trailing: 60}, true)).toBe(true);
    // Exactly the room is room.
    expect(accessoryFits({bar: 396, leading: 150, trailing: 60}, true)).toBe(true);
    // 395 leaves 95: no room, so a row of its own.
    expect(accessoryFits({bar: 395, leading: 150, trailing: 60}, true)).toBe(false);
    // The wider end decides, whichever end it is.
    expect(accessoryFits({bar: 400, leading: 100, trailing: 160}, true)).toBe(false);
    // An end narrower than the bar's side still takes the side.
    expect(accessoryFits({bar: 208, leading: 40}, true)).toBe(true);
    expect(accessoryFits({bar: 207, leading: 40}, true)).toBe(false);
  });

  it('sits in the bar before the bar or its leading end is measured', () => {
    expect(accessoryFits({}, true)).toBe(true);
    expect(accessoryFits({leading: 300, trailing: 60}, true)).toBe(true);
    expect(accessoryFits({bar: 200, trailing: 60}, true)).toBe(true);
  });

  it('sits in the bar whatever the widths with no title or subtitle to centre', () => {
    expect(accessoryFits({bar: 200, leading: 180, trailing: 60}, false)).toBe(true);
  });

  it('is the accessory placed in the bar when React draws something for it, and none in a row or with nothing to draw', () => {
    const filter = 'Filter';
    expect(barAccessory(filter, 'bar')).toBe(filter);
    expect(barAccessory(filter, 'row')).toBeUndefined();
    expect(barAccessory(filter, undefined)).toBeUndefined();
    expect(barAccessory(false, 'bar')).toBeUndefined();
    expect(barAccessory(undefined, 'bar')).toBeUndefined();
  });
});
