import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {prepare} from '../lib/run.ts';
import type {Point, Snapshot, SnapshotNode, Target} from '../lib/snapshot.ts';
import {asSelector, describeTarget, findNode, isPoint} from '../lib/snapshot.ts';
import type {Availability, Driver, DriverOptions, SnapshotOptions, StepResult} from '../lib/types.ts';
import {failed, ok} from '../lib/types.ts';

const DEFAULT_URL = 'http://localhost:8081';

/** Where a `playwright install` leaves the headless shell, when playwright cannot find it itself. */
function shells(): string[] {
  const home = process.env.LOCALAPPDATA ?? process.env.HOME ?? '';
  const roots = [path.join(home, 'ms-playwright'), path.join(home, 'Library', 'Caches', 'ms-playwright'), path.join(home, '.cache', 'ms-playwright')];
  const found: string[] = [];
  for (const root of roots) {
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(root).filter(entry => entry.startsWith('chromium_headless_shell-') || entry.startsWith('chromium-'));
    } catch {
      continue;
    }
    entries.sort((a, b) => Number(b.split('-').at(-1)) - Number(a.split('-').at(-1)));
    for (const entry of entries) {
      for (const relative of [
        path.join('chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
        path.join('chrome-win', 'headless_shell.exe'),
        path.join('chrome-win', 'chrome.exe'),
        path.join('chrome-headless-shell-mac', 'chrome-headless-shell'),
        path.join('chrome-linux', 'headless_shell'),
        path.join('chrome-linux', 'chrome'),
      ]) {
        const file = path.join(root, entry, relative);
        if (fs.existsSync(file)) found.push(file);
      }
    }
  }
  return found;
}

/** Runs in the page: tags every interesting element with a ref and reads its role, name and box. */
const COLLECT = `(() => {
  // What can be acted on, plus the leaves that carry text — the same two kinds
  // UI Automation reports on Windows, so a test finds a label on either. A
  // container's text is its children's, so only leaves are taken; that keeps
  // the tree small enough to read and to put in front of a model.
  const selector = '[role],button,a,input,select,textarea,h1,h2,h3,h4,dialog,[popover],[tabindex],p,li,td,label,span,div';
  const ACTIONABLE = new Set(['button', 'link', 'a', 'menuitem', 'menuitemcheckbox', 'checkbox', 'switch', 'tab', 'textbox', 'input', 'select', 'textarea', 'slider', 'option', 'radio']);
  const depthOf = (node) => { let d = 0; for (let p = node.parentElement; p; p = p.parentElement) d++; return d; };
  let next = 0;
  const nodes = [];
  const PLAIN = new Set(['P', 'LI', 'TD', 'LABEL', 'SPAN', 'DIV']);
  for (const element of document.querySelectorAll(selector)) {
    const box = element.getBoundingClientRect();
    const role = element.getAttribute('role') ?? element.tagName.toLowerCase();
    // A plain container earns a place only when it is the leaf holding the text.
    if (PLAIN.has(element.tagName) && !element.hasAttribute('role') && (element.childElementCount > 0 || !(element.textContent ?? '').trim())) continue;
    // The accessible name, in the order a screen reader works it out. The last
    // two steps are not optional niceties: a checkbox is an empty <input> with
    // no text of its own, and it takes its name from the <label> wrapped round
    // it — reading textContent alone reports it as nameless and fails an
    // accessibility assertion that is actually being met.
    let name = element.getAttribute('aria-label') ?? '';
    if (!name) {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        name = labelledBy.split(/\\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
      }
    }
    if (!name && element.labels && element.labels.length > 0) {
      name = [...element.labels].map((each) => each.textContent ?? '').join(' ').replace(/\\s+/g, ' ').trim();
    }
    if (!name) {
      const copy = element.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
      name = (copy.textContent ?? '').replace(/\\s+/g, ' ').trim();
    }
    name = name.slice(0, 80);
    next++;
    const ref = 'e' + next;
    element.setAttribute('data-harness-ref', ref);
    // react-native-web writes testID as data-testid, and an app's own DOM
    // components write it directly, so both arrive here the same way.
    const testId = element.getAttribute('data-testid');
    nodes.push({
      ref: '@' + ref,
      role,
      name,
      ...(testId ? {testId} : null),
      depth: depthOf(element),
      interactive: ACTIONABLE.has(role) || ACTIONABLE.has(element.tagName.toLowerCase()),
      focused: document.activeElement === element,
      enabled: !element.hasAttribute('disabled'),
      offscreen: box.width === 0 || box.height === 0,
      bounds: {x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height)},
    });
  }
  return nodes;
})()`;

/**
 * The web harness: a real Chromium over the app's web build, which is the DOM
 * it renders rather than a React Native emulation of it. One browser is
 * kept for the whole run, so a sequence of steps shares a page the way a person
 * using the app would.
 *
 * Snapshots carry the same refs as every other platform, and a press finds its
 * element by that ref rather than by a coordinate.
 */
export function webDriver(options: DriverOptions): Driver {
  const require = createRequire(path.join(options.root, 'package.json'));
  const base = options.url ?? DEFAULT_URL;
  let browser: {newPage(o?: unknown): Promise<Page>; close(): Promise<void>} | null = null;
  let page: Page | null = null;

  interface Locator {
    click(o?: unknown): Promise<void>;
    fill(text: string): Promise<void>;
    count(): Promise<number>;
  }
  interface Page {
    goto(url: string, o?: unknown): Promise<unknown>;
    screenshot(o: {path: string; fullPage?: boolean}): Promise<unknown>;
    mouse: {click(x: number, y: number): Promise<void>};
    keyboard: {type(text: string): Promise<void>; press(key: string): Promise<void>};
    locator(selector: string): Locator;
    evaluate<T>(fn: string): Promise<T>;
  }

  function playwright() {
    try {
      return require('playwright-core') as {chromium: {launch(o?: unknown): Promise<typeof browser>}};
    } catch {
      return null;
    }
  }

  async function open(): Promise<Page> {
    if (page) return page;
    const driver = playwright();
    if (!driver) throw new Error('playwright-core is not installed in this project');
    let launched: typeof browser = null;
    const reasons: string[] = [];
    for (const executablePath of [undefined, ...shells()]) {
      try {
        launched = await driver.chromium.launch(executablePath ? {headless: true, executablePath} : {headless: true});
        break;
      } catch (error) {
        reasons.push((error as Error).message.split('\n')[0] ?? '');
      }
    }
    if (!launched) throw new Error(`no Chromium to drive (${reasons[0] ?? 'unknown reason'}); run \`bunx playwright install chromium\``);
    browser = launched;
    page = await launched.newPage({viewport: {width: 1280, height: 900}});
    return page;
  }

  function target(to: string): string {
    return /^[a-z]+:\/\//i.test(to) ? to : new URL(to.startsWith('/') ? to : `/${to}`, base).toString();
  }

  async function snapshot(snapshotOptions: SnapshotOptions = {}): Promise<Snapshot> {
    const current = await open();
    let nodes: SnapshotNode[];
    try {
      nodes = await current.evaluate<SnapshotNode[]>(COLLECT);
    } catch (error) {
      // A press on a link navigates, which throws away the context the script
      // was going to run in. The page that replaced it is the one being asked
      // about, so let it arrive and ask again.
      if (!/context was destroyed|Execution context/i.test((error as Error).message)) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
      nodes = await current.evaluate<SnapshotNode[]>(COLLECT);
    }
    return {
      platform: 'web',
      source: base,
      nodes: snapshotOptions.interactive ? nodes.filter(node => node.interactive && !node.offscreen) : nodes,
    };
  }

  /**
   * Where a target is, resolved against a tree taken now.
   *
   * The snapshot tags elements with their ref, but React replaces nodes as it
   * reconciles and the attribute goes with them, so a locator built from it
   * waits for an element that no longer exists. The bounds are read at the same
   * moment and are what every other platform presses by, so the harness reads
   * the same everywhere.
   */
  async function pointFor(what: Target): Promise<{point: Point; note: string}> {
    const selector = asSelector(what);
    if (isPoint(selector)) return {point: selector, note: `${selector.x},${selector.y}`};
    const tree = await snapshot();
    const node = findNode(tree, selector);
    if (!node) throw new Error(`nothing matches ${describeTarget(what)} on the page (${tree.nodes.length} nodes)`);
    if (!node.bounds || node.bounds.width === 0) throw new Error(`${node.ref} ${node.role} ${JSON.stringify(node.name)} is not on screen to press`);
    return {
      point: {x: Math.round(node.bounds.x + node.bounds.width / 2), y: Math.round(node.bounds.y + node.bounds.height / 2)},
      note: `${node.ref} ${node.role} ${JSON.stringify(node.name)}`,
    };
  }

  return {
    platform: 'web',

    async available(): Promise<Availability> {
      if (!playwright()) return {ready: false, reason: 'playwright-core is not installed; add it to this project'};
      const shell = shells()[0];
      return {ready: true, found: shell ? `Chromium at ${path.basename(path.dirname(shell))}` : 'Chromium through playwright'};
    },

    async open(to: string): Promise<StepResult> {
      const current = await open();
      const url = target(to);
      await current.goto(url, {waitUntil: 'load', timeout: 30_000});
      return ok(`opened ${url}`);
    },

    snapshot,

    async press(what: Target): Promise<StepResult> {
      try {
        const {point, note} = await pointFor(what);
        const current = await open();
        await current.mouse.click(point.x, point.y);
        return ok(`pressed ${note}`);
      } catch (error) {
        return failed((error as Error).message.split('\n')[0] ?? 'press failed');
      }
    },

    async fill(what: Target, text: string): Promise<StepResult> {
      try {
        const {point, note} = await pointFor(what);
        const current = await open();
        await current.mouse.click(point.x, point.y);
        await current.keyboard.type(text);
        return ok(`filled ${note} with ${JSON.stringify(text)}`);
      } catch (error) {
        return failed((error as Error).message.split('\n')[0] ?? 'fill failed');
      }
    },

    async type(text: string): Promise<StepResult> {
      const current = await open();
      await current.keyboard.type(text);
      return ok(`typed ${text.length} characters`);
    },

    async key(name: string): Promise<StepResult> {
      const current = await open();
      await current.keyboard.press(name);
      return ok(`pressed ${name}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const current = await open();
      const out = prepare(file);
      await current.screenshot({path: out});
      return ok(`saved ${path.relative(options.root, out)}`);
    },

    async idleSeconds(): Promise<number | null> {
      // A headless browser has no user to be idle.
      return null;
    },

    async close(): Promise<void> {
      await browser?.close().catch(() => {});
      browser = null;
      page = null;
    },
  };
}
