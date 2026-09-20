/**
 * Matchers for the device tests. Registered by the device project's setup file.
 *
 * The assertion is the accessibility tree rather than the pixels. A tree is
 * stable across machines and scale factors, it diffs legibly in review, and it
 * is what a screen reader reads — so a regression in it is a regression a
 * person would feel. Screenshots are still taken, as evidence to look at when
 * something fails, not as the thing being asserted.
 */
import fs from 'node:fs';
import path from 'node:path';
import {expect} from 'vitest';
import {comparePng} from '../harness/lib/png.ts';
import type {Selector, Snapshot, SnapshotNode} from '../harness/lib/snapshot.ts';
import {describeTarget, findNode} from '../harness/lib/snapshot.ts';

/** The project under test: where the tests are run from, unless `HARNESS_ROOT` names it. */
const ROOT = path.resolve(process.env.HARNESS_ROOT ?? process.cwd());

/** What a screenshot is compared against, kept per platform because they do not look alike. */
export function baselineFor(platform: string, name: string): string {
  return path.join(ROOT, 'device', '__screenshots__', platform, `${name}.png`);
}

/** Something that can take its own picture — the device, in practice. */
interface Photographable {
  platform: string;
  screenshot(name: string): Promise<string>;
}

/** What a tree looks like when it is written into a test's expectations. */
export function summarise(snapshot: Snapshot): string[] {
  return snapshot.nodes.map(node => `${node.role} ${JSON.stringify(node.name)}`);
}

/** Every interactive node that a screen reader would announce as nothing but its role. */
export function unnamed(snapshot: Snapshot): SnapshotNode[] {
  return snapshot.nodes.filter(node => node.interactive && !node.name.trim());
}

expect.extend({
  /** The tree contains something the selector names. */
  toHaveElement(received: Snapshot, selector: Selector) {
    const node = findNode(received, selector);
    return {
      pass: Boolean(node),
      message: () =>
        node
          ? `expected no element matching ${describeTarget(selector)}, found ${node.ref} ${node.role} ${JSON.stringify(node.name)}`
          : `expected an element matching ${describeTarget(selector)}; the tree has ${received.nodes.length} nodes:\n  ${summarise(received).join('\n  ')}`,
    };
  },

  /**
   * Every element a person can act on carries an accessible name. This is the
   * check that keeps catching real defects: a glyph-and-text button reads as
   * "button" to Narrator unless the control names itself.
   */
  toBeFullyLabelled(received: Snapshot) {
    const missing = unnamed(received);
    return {
      pass: missing.length === 0,
      message: () =>
        missing.length === 0
          ? `expected some interactive element to have no accessible name, but all ${received.nodes.length} are named`
          : `${missing.length} interactive element${missing.length === 1 ? '' : 's'} would be announced with no name:\n  ` +
            missing.map(node => `${node.ref} ${node.role} at ${node.bounds ? `${node.bounds.x},${node.bounds.y}` : 'unknown'}`).join('\n  '),
    };
  },
});

/** Something whose focus can be moved with a key — the device, in practice. */
interface Navigable {
  platform: string;
  snapshot(options?: {interactive?: boolean}): Promise<Snapshot>;
  key(name: string): Promise<'pressed' | 'skipped'>;
}

/**
 * How a node reads when comparing two snapshots. Refs are numbered per
 * snapshot, so they cannot say whether the focus moved; what a node *is* can.
 */
export function identify(node: SnapshotNode): string {
  return `${node.role} ${node.testId ?? node.name}`;
}

expect.extend({
  /**
   * Pressing the key moves the focus.
   *
   * This is the half of a composite ARIA role that axe cannot check. It reads
   * the roles and never presses anything, so a `role="menu"` or
   * `role="radiogroup"` with no arrow keys behind it passes every static check
   * while being unusable without a pointer — which is exactly what this kit
   * shipped until `src/a11y/roving.ts`. Only a real renderer can answer it.
   */
  async toSupportArrowNavigation(received: Navigable, key = 'ArrowDown') {
    const before = await received.snapshot({interactive: false});
    const from = before.nodes.find(node => node.focused);
    if (!from) {
      return {
        pass: false,
        message: () =>
          `nothing has focus, so ${key} has nowhere to move from — press or focus an element first. ` +
          `The tree has ${before.nodes.length} nodes.`,
      };
    }
    if ((await received.key(key)) === 'skipped') {
      return {pass: true, message: () => `the ${received.platform} harness cannot send ${key}, so this was not checked`};
    }
    const after = await received.snapshot({interactive: false});
    const to = after.nodes.find(node => node.focused);
    const pass = !!to && identify(to) !== identify(from);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${key} to leave the focus on ${identify(from)}, but it moved to ${identify(to!)}`
          : to
            ? `${key} left the focus on ${identify(from)}. A composite role promises the arrow keys move within it; this one does not keep that promise.`
            : `${key} lost the focus entirely — nothing in the tree is focused after it, which is worse than not moving.`,
    };
  },
});

expect.extend({
  /**
   * The screen against a committed baseline, pixel by pixel.
   *
   * The first run writes the baseline and passes, because there is nothing to
   * compare against yet — except in CI, where a missing baseline is a failure
   * rather than something to invent, so a run cannot go green by creating its
   * own expectations. A failure leaves the picture it took and a diff with the
   * changed pixels in red beside it.
   */
  async toMatchScreenshot(received: Photographable, name: string, {maxRatio = 0.002}: {maxRatio?: number} = {}) {
    const baseline = baselineFor(received.platform, name);
    const taken = await received.screenshot(`${received.platform}-${name}.actual`);
    const actual = fs.readFileSync(taken);
    if (!fs.existsSync(baseline)) {
      // A baseline belongs to the machine that drew it: the same page renders
      // differently under a different font stack, so one recorded on a desk
      // cannot be asserted on a Linux runner. Without one, the picture is kept
      // as evidence and the tree assertions carry the test. Recording is
      // deliberate, never a side effect of running.
      if (process.env.HARNESS_UPDATE_SCREENSHOTS) {
        fs.mkdirSync(path.dirname(baseline), {recursive: true});
        fs.writeFileSync(baseline, actual);
        return {pass: true, message: () => `recorded a baseline at ${path.relative(ROOT, baseline)}`};
      }
      return {
        pass: true,
        message: () =>
          `no baseline for ${name} on ${received.platform}; kept ${path.relative(ROOT, taken)} as evidence. ` +
          `Record one where you mean to assert it: HARNESS_UPDATE_SCREENSHOTS=1`,
      };
    }
    const result = comparePng(fs.readFileSync(baseline), actual, {tolerance: 8});
    if (result.diff) fs.writeFileSync(path.join(ROOT, '.harness', `${received.platform}-${name}.diff.png`), result.diff);
    const pass = result.comparable && result.ratio <= maxRatio;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${name} to differ from its baseline by more than ${maxRatio * 100}%, but ${(result.ratio * 100).toFixed(3)}% of pixels differ`
          : result.comparable
            ? `${name} differs from its baseline in ${result.different} of ${result.total} pixels (${(result.ratio * 100).toFixed(3)}%, allowed ${maxRatio * 100}%). ` +
              `What it looks like now is in ${path.relative(ROOT, taken)}, and the difference in .harness/${received.platform}-${name}.diff.png`
            : `${name} cannot be compared: ${result.reason}`,
    };
  },
});

// Vitest 4 re-exports `Matchers` from `@vitest/expect`, and an augmentation of
// the re-exporting module does not merge: the interface is extended at its
// origin, with the type parameter it is declared with there.
declare module '@vitest/expect' {
  interface Matchers<T = any> {
    toHaveElement(selector: Selector): T;
    toBeFullyLabelled(): T;
    toSupportArrowNavigation(key?: string): Promise<T>;
    toMatchScreenshot(name: string, options?: {maxRatio?: number}): Promise<T>;
  }
}
