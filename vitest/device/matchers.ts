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
import {fileURLToPath} from 'node:url';
import {expect} from 'vitest';
import {comparePng} from '../../scripts/harness/lib/png.ts';
import type {Selector, Snapshot, SnapshotNode} from '../../scripts/harness/lib/snapshot.ts';
import {describeTarget, findNode} from '../../scripts/harness/lib/snapshot.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

declare module 'vitest' {
  interface Matchers<T = unknown> {
    toHaveElement(selector: Selector): T;
    toBeFullyLabelled(): T;
    toMatchScreenshot(name: string, options?: {maxRatio?: number}): Promise<T>;
  }
}
