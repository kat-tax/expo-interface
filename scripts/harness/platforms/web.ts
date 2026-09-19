import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {prepare} from '../lib/run.ts';
import type {Availability, Driver, DriverOptions, StepResult} from '../lib/types.ts';
import {ok} from '../lib/types.ts';

const DEFAULT_URL = 'http://localhost:8081';

/** Where a `playwright install` leaves the headless shell, when playwright cannot find it itself. */
function shells(): string[] {
  const home = process.env.LOCALAPPDATA ?? process.env.HOME ?? '';
  const roots = [
    path.join(home, 'ms-playwright'),
    path.join(home, 'Library', 'Caches', 'ms-playwright'),
    path.join(home, '.cache', 'ms-playwright'),
  ];
  const found: string[] = [];
  for (const root of roots) {
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(root).filter(entry => entry.startsWith('chromium_headless_shell-') || entry.startsWith('chromium-'));
    } catch {
      continue;
    }
    // Newest build first: the directory name ends in the build number.
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

/**
 * The web harness: a real Chromium over the kit's web build, which is the DOM
 * the kit renders rather than a React Native emulation of it. One browser is
 * kept for the whole run, so a sequence of steps shares a page the way a person
 * using the app would.
 */
export function webDriver(options: DriverOptions): Driver {
  const require = createRequire(path.join(options.root, 'package.json'));
  const base = options.url ?? DEFAULT_URL;
  let browser: {newPage(o?: unknown): Promise<Page>; close(): Promise<void>} | null = null;
  let page: Page | null = null;

  interface Page {
    goto(url: string, o?: unknown): Promise<unknown>;
    screenshot(o: {path: string; fullPage?: boolean}): Promise<unknown>;
    mouse: {click(x: number, y: number): Promise<void>};
    keyboard: {type(text: string): Promise<void>};
    accessibility?: {snapshot(): Promise<unknown>};
    evaluate<T>(fn: () => T): Promise<T>;
    url(): string;
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
    if (!driver) throw new Error('playwright-core is not installed in this repository');
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

  /** A path becomes a URL under the base; a URL is taken as it is. */
  function target(to: string): string {
    return /^[a-z]+:\/\//i.test(to) ? to : new URL(to.startsWith('/') ? to : `/${to}`, base).toString();
  }

  return {
    platform: 'web',

    async available(): Promise<Availability> {
      if (!playwright()) return {ready: false, reason: 'playwright-core is not installed; run an install in this repository'};
      const shell = shells()[0];
      return {ready: true, found: shell ? `Chromium at ${path.basename(path.dirname(shell))}` : 'Chromium through playwright'};
    },

    async open(to: string): Promise<StepResult> {
      const current = await open();
      const url = target(to);
      await current.goto(url, {waitUntil: 'load', timeout: 30_000});
      return ok(`opened ${url}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const current = await open();
      const out = prepare(file);
      await current.screenshot({path: out});
      return ok(`saved ${path.relative(options.root, out)}`);
    },

    async tap(x: number, y: number): Promise<StepResult> {
      const current = await open();
      await current.mouse.click(x, y);
      return ok(`clicked ${x},${y}`);
    },

    async type(text: string): Promise<StepResult> {
      const current = await open();
      await current.keyboard.type(text);
      return ok(`typed ${text.length} characters`);
    },

    async tree(): Promise<StepResult> {
      const current = await open();
      const snapshot = await current.accessibility?.snapshot();
      if (snapshot) return ok('read the accessibility tree', JSON.stringify(snapshot, null, 1));
      // Playwright dropped the snapshot API in some versions; the DOM's own
      // roles and names are the same thing a screen reader reads.
      const roles = await current.evaluate(() =>
        [...document.querySelectorAll('[role],button,a,input,select,textarea,h1,h2,h3,dialog,[popover]')]
          .map(node => {
            const element = node as HTMLElement;
            const role = element.getAttribute('role') ?? element.tagName.toLowerCase();
            // The accessible name the way a screen reader computes it: the label
            // if there is one, else the text that is not hidden from it — an icon
            // marked aria-hidden is not part of the name, and counting it would
            // report a name that nobody hears.
            let name = element.getAttribute('aria-label') ?? '';
            if (!name) {
              const copy = element.cloneNode(true) as HTMLElement;
              copy.querySelectorAll('[aria-hidden="true"]').forEach(hidden => hidden.remove());
              name = copy.textContent?.replace(/\s+/g, ' ').trim().slice(0, 60) ?? '';
            }
            const interactive = ['button', 'link', 'a', 'menuitem', 'checkbox', 'switch', 'tab', 'textbox'].includes(role);
            return `${role} ${JSON.stringify(name)}${interactive && !name ? '  <- no accessible name' : ''}`;
          })
          .join('\n'),
      );
      return ok('read the roles and names in the document', roles);
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
