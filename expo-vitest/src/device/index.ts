/**
 * Driving a real app from Vitest, in the shape `mobile-test` uses: a `device`,
 * an `element(by.…)` and matchers, with all the matching and waiting in
 * TypeScript rather than in a DSL.
 *
 * Underneath is this package's harness, so one test runs on Windows (driven
 * here, because `agent-device` has no Windows backend), on iOS and Android
 * (driven by `agent-device`) and on web (a headless Chromium). The app under
 * test needs no SDK and no rebuild.
 *
 *   import {by, device, element} from 'expo-vitest/device';
 *
 *   await device.open('/');
 *   await element(by.label('Settings')).press();
 *   await expect(device).toHaveElement(by.label('Name'));
 */
import path from 'node:path';
import {driverFor} from '../harness/lib/drivers.ts';
import type {Selector, Snapshot, SnapshotNode} from '../harness/lib/snapshot.ts';
import {by, describeTarget, findNode} from '../harness/lib/snapshot.ts';
import type {Driver, Platform} from '../harness/lib/types.ts';

export {by};
export type {Selector, Snapshot, SnapshotNode};

/** The project under test: where the tests are run from, unless `HARNESS_ROOT` names it. */
const ROOT = path.resolve(process.env.HARNESS_ROOT ?? process.cwd());

/** How the device under test is named, from the environment the runner was given. */
export interface DeviceConfig {
  platform: Platform;
  url?: string;
  scheme?: string;
  target?: string;
}

export function configFromEnvironment(environment: NodeJS.ProcessEnv = process.env): DeviceConfig {
  const platform = (environment.HARNESS_PLATFORM ?? 'web') as Platform;
  return {
    platform,
    url: environment.HARNESS_URL,
    scheme: environment.HARNESS_SCHEME,
    target: environment.HARNESS_TARGET,
  };
}

class Device {
  readonly config: DeviceConfig;
  private driver: Driver | null = null;

  constructor(config: DeviceConfig) {
    this.config = config;
  }

  get platform(): Platform {
    return this.config.platform;
  }

  /** The driver, made on first use and kept for the file's tests. */
  async ready(): Promise<Driver> {
    if (this.driver) return this.driver;
    const driver = driverFor(this.config.platform, {root: ROOT, url: this.config.url, scheme: this.config.scheme, target: this.config.target});
    const state = await driver.available();
    if (!state.ready) throw new Error(`no ${this.config.platform} device to drive: ${state.reason}`);
    this.driver = driver;
    return driver;
  }

  async open(route: string): Promise<void> {
    const result = await (await this.ready()).open(route);
    if (!result.ok) throw new Error(result.message);
  }

  async snapshot(options: {interactive?: boolean} = {interactive: true}): Promise<Snapshot> {
    return (await this.ready()).snapshot(options);
  }

  /** The whole tree, including what cannot be acted on. */
  async fullSnapshot(): Promise<Snapshot> {
    return (await this.ready()).snapshot({interactive: false});
  }

  async screenshot(name: string): Promise<string> {
    const file = path.join(ROOT, '.harness', `${name}.png`);
    const result = await (await this.ready()).screenshot(file);
    if (!result.ok) throw new Error(result.message);
    return file;
  }

  async type(text: string): Promise<void> {
    const result = await (await this.ready()).type(text);
    if (!result.ok) throw new Error(result.message);
  }

  /**
   * A named key where the focus is: `ArrowDown`, `Home`, `Enter`.
   *
   * Answers `'skipped'` on a backend that cannot send one, so a test written
   * for four platforms still runs on all of them and says what it could not do
   * rather than failing for the wrong reason.
   */
  async key(name: string): Promise<'pressed' | 'skipped'> {
    const driver = await this.ready();
    if (!driver.key) return 'skipped';
    const result = await driver.key(name);
    if (!result.ok) throw new Error(result.message);
    return result.skipped ? 'skipped' : 'pressed';
  }

  /** Waits until a selector is in the tree, or says what was there instead. */
  async waitFor(selector: Selector, {timeout = 10_000, interval = 400} = {}): Promise<SnapshotNode> {
    const deadline = Date.now() + timeout;
    let last: Snapshot = {platform: this.config.platform, nodes: []};
    for (;;) {
      last = await this.snapshot({interactive: false});
      const node = findNode(last, selector);
      if (node) return node;
      if (Date.now() >= deadline) break;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`${describeTarget(selector)} never appeared within ${timeout} ms; the tree has ${last.nodes.length} nodes`);
  }

  async close(): Promise<void> {
    await this.driver?.close();
    this.driver = null;
  }
}

export const device = new Device(configFromEnvironment());

/** One element, found fresh each time it is acted on — a ref from an old tree is stale. */
export function element(selector: Selector) {
  return {
    selector,
    async press(): Promise<void> {
      const result = await (await device.ready()).press(selector);
      if (!result.ok) throw new Error(result.message);
    },
    async fill(text: string): Promise<void> {
      const result = await (await device.ready()).fill(selector, text);
      if (!result.ok) throw new Error(result.message);
    },
    async node(): Promise<SnapshotNode | undefined> {
      return findNode(await device.fullSnapshot(), selector);
    },
    async waitFor(options?: {timeout?: number}): Promise<SnapshotNode> {
      return device.waitFor(selector, options);
    },
  };
}
