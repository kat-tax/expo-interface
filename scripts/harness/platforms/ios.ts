import path from 'node:path';
import {firstLine, prepare, run} from '../lib/run.ts';
import type {Availability, Driver, DriverOptions, StepResult} from '../lib/types.ts';
import {elsewhere, failed, ok} from '../lib/types.ts';

/**
 * The iOS harness: `simctl` against a booted simulator. Apple gives a simulator
 * screenshots and deep links from the command line, and nothing else — a press
 * needs a UI test target running inside the app, which is a heavier thing than
 * this harness is. Those steps say so rather than pretending.
 */
export function iosDriver(options: DriverOptions): Driver {
  const device = options.target ?? 'booted';

  function simctl(args: string[]) {
    return run('xcrun', ['simctl', ...args]);
  }

  return {
    platform: 'ios',

    async available(): Promise<Availability> {
      if (process.platform !== 'darwin') return {ready: false, reason: 'the iOS simulator only runs on macOS'};
      const result = run('xcrun', ['simctl', 'list', 'devices', 'booted']);
      if (result.missing) return {ready: false, reason: 'xcrun is not installed; it comes with Xcode'};
      const booted = result.stdout.split(/\r?\n/).filter(line => line.includes('(Booted)'));
      if (booted.length === 0) return {ready: false, reason: 'no simulator is booted; open one with `bun run ios`'};
      return {ready: true, found: booted.map(line => line.trim()).join('; ')};
    },

    async open(to: string): Promise<StepResult> {
      const url = /^[a-z]+:/i.test(to) ? to : `${options.scheme ?? 'exp'}://${to.replace(/^\//, '')}`;
      const result = simctl(['openurl', device, url]);
      return result.ok ? ok(`opened ${url}`) : failed(`could not open ${url}: ${firstLine(result.stderr)}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const out = prepare(file);
      const result = simctl(['io', device, 'screenshot', out]);
      return result.ok ? ok(`saved ${path.relative(options.root, out)}`) : failed(`screenshot failed: ${firstLine(result.stderr)}`);
    },

    async tap(): Promise<StepResult> {
      return elsewhere('a synthetic press', 'ios', 'simctl has no input command; a press needs a UI test target inside the app');
    },

    async type(): Promise<StepResult> {
      return elsewhere('typing', 'ios', 'simctl has no input command; a press needs a UI test target inside the app');
    },

    async tree(): Promise<StepResult> {
      return elsewhere('reading the accessibility tree', 'ios', 'it is behind XCUITest, which runs inside the app');
    },

    async idleSeconds(): Promise<number | null> {
      // A simulator window is not where synthetic input goes, so this does not apply.
      return null;
    },

    async close(): Promise<void> {},
  };
}
