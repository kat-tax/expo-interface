import {COMPACT_WIDTH, isCompact} from './size-class';
import {TAB_BREAKPOINT} from './tab-view/shared';

describe('the compact size class', () => {
  it('is narrower than 640, and a width not measured yet is not in it', () => {
    expect(COMPACT_WIDTH).toBe(640);
    expect(TAB_BREAKPOINT).toBe(COMPACT_WIDTH);
    expect(isCompact(390)).toBe(true);
    expect(isCompact(639)).toBe(true);
    expect(isCompact(640)).toBe(false);
    expect(isCompact(0)).toBe(false);
  });
});
