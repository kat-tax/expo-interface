import fs from 'node:fs';
import path from 'node:path';
import {firstLine, prepare, run, runBinary} from '../lib/run.ts';
import type {Availability, Driver, DriverOptions, StepResult} from '../lib/types.ts';
import {failed, ok} from '../lib/types.ts';

/**
 * The Android harness: adb against a device or emulator. Everything here is a
 * shell command on the device, so it works the same against hardware and an
 * emulator, and needs nothing installed in the app.
 */
export function androidDriver(options: DriverOptions): Driver {
  const serial = options.target;
  const device = (args: string[]) => run('adb', [...(serial ? ['-s', serial] : []), ...args]);

  function devices(): string[] {
    const result = run('adb', ['devices']);
    if (!result.ok) return [];
    return result.stdout
      .split(/\r?\n/)
      .slice(1)
      .map(line => line.trim())
      .filter(line => line.endsWith('device'))
      .map(line => line.split(/\s+/)[0] ?? '');
  }

  return {
    platform: 'android',

    async available(): Promise<Availability> {
      if (run('adb', ['version']).missing) return {ready: false, reason: 'adb is not installed; it comes with the Android SDK platform tools'};
      const attached = devices();
      if (attached.length === 0) return {ready: false, reason: 'no device or emulator is attached (adb devices is empty)'};
      return {ready: true, found: `${attached.length} device${attached.length === 1 ? '' : 's'}: ${attached.join(', ')}`};
    },

    async open(to: string): Promise<StepResult> {
      const url = /^[a-z]+:/i.test(to) ? to : `${options.scheme ?? 'exp'}://${to.replace(/^\//, '')}`;
      const result = device(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url]);
      if (!result.ok) return failed(`could not open ${url}: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(`opened ${url}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const out = prepare(file);
      // Straight down the pipe: exec-out keeps the bytes binary, where `shell`
      // would translate the line endings and corrupt the PNG.
      const result = runBinary('adb', [...(serial ? ['-s', serial] : []), 'exec-out', 'screencap', '-p'], {timeout: 60_000});
      if (!result.ok) return failed(`screenshot failed: ${firstLine(result.stderr)}`);
      fs.writeFileSync(out, result.stdout);
      return ok(`saved ${path.relative(options.root, out)} (${Math.round(result.stdout.length / 1024)} KB)`);
    },

    async tap(x: number, y: number): Promise<StepResult> {
      const result = device(['shell', 'input', 'tap', String(x), String(y)]);
      return result.ok ? ok(`tapped ${x},${y}`) : failed(`tap failed: ${firstLine(result.stderr)}`);
    },

    async type(text: string): Promise<StepResult> {
      // `input text` takes no spaces; %s is how the shell spells one.
      const result = device(['shell', 'input', 'text', text.replace(/ /g, '%s')]);
      return result.ok ? ok(`typed ${JSON.stringify(text)}`) : failed(`typing failed: ${firstLine(result.stderr)}`);
    },

    async tree(): Promise<StepResult> {
      const dump = device(['shell', 'uiautomator', 'dump', '/sdcard/harness-ui.xml']);
      if (!dump.ok) return failed(`could not dump the tree: ${firstLine(dump.stderr) || firstLine(dump.stdout)}`);
      const read = device(['shell', 'cat', '/sdcard/harness-ui.xml']);
      if (!read.ok) return failed(`could not read the tree: ${firstLine(read.stderr)}`);
      device(['shell', 'rm', '-f', '/sdcard/harness-ui.xml']);
      // The XML is one long line; the interesting part is what each node is called.
      const nodes = [...read.stdout.matchAll(/<node[^>]*>/g)]
        .map(match => match[0])
        .map(node => {
          const attribute = (name: string) => node.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
          const label = attribute('text') || attribute('content-desc');
          const role = attribute('class').split('.').at(-1) ?? '';
          const clickable = attribute('clickable') === 'true' ? ' [clickable]' : '';
          return label || clickable ? `${role} ${JSON.stringify(label)}${clickable}` : '';
        })
        .filter(Boolean);
      return ok('read the uiautomator tree', nodes.join('\n'));
    },

    async idleSeconds(): Promise<number | null> {
      // A device is not this machine's desktop: nobody's clicks are at risk.
      return null;
    },

    async close(): Promise<void> {},
  };
}
