/**
 * Matchers for the device tests. Registered by the device project's setup file.
 *
 * The assertion is the accessibility tree rather than the pixels. A tree is
 * stable across machines and scale factors, it diffs legibly in review, and it
 * is what a screen reader reads — so a regression in it is a regression a
 * person would feel. Screenshots are still taken, as evidence to look at when
 * something fails, not as the thing being asserted.
 */
import {expect} from 'vitest';
import type {Selector, Snapshot, SnapshotNode} from '../../scripts/harness/lib/snapshot.ts';
import {describeTarget, findNode} from '../../scripts/harness/lib/snapshot.ts';

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

declare module 'vitest' {
  interface Matchers<T = unknown> {
    toHaveElement(selector: Selector): T;
    toBeFullyLabelled(): T;
  }
}
