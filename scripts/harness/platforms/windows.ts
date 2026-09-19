import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {firstLine, powershell, prepare, run} from '../lib/run.ts';
import type {Availability, Driver, DriverOptions, StepResult} from '../lib/types.ts';
import {elsewhere, failed, ok} from '../lib/types.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..', 'windows');

/** Where a built app tends to be, when nobody said. */
const GUESSES = [
  'example/windows/x64/Release',
  'example/windows/x64/Debug',
  'windows/x64/Release',
  'windows/x64/Debug',
];

function findExe(root: string): string | null {
  for (const guess of GUESSES) {
    const directory = path.join(root, guess);
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(directory).filter(entry => entry.endsWith('.exe'));
    } catch {
      continue;
    }
    // The app, not a tool that landed beside it.
    const exe = entries.find(entry => !/^(vc_redist|WindowsAppRuntime)/i.test(entry));
    if (exe) return path.join(directory, exe);
  }
  return null;
}

function script(name: string): string {
  return path.join(SCRIPTS, name);
}

/**
 * The Windows harness: a built app driven through the window manager, because
 * there is no remote protocol into a react-native-windows app. Screenshots come
 * from the screen, presses from synthetic input, and the accessibility tree from
 * UI Automation, which is what Narrator reads.
 *
 * Synthetic input goes to whatever is in front. If the user is at the desk, it
 * lands in their window instead — so every press checks first how long the
 * machine has been idle, and refuses unless it has been quiet or `--force` says
 * to go ahead anyway.
 */
export function windowsDriver(options: DriverOptions): Driver {
  const target = options.target ?? findExe(options.root) ?? '';
  const isExe = target.toLowerCase().endsWith('.exe');
  const exe = isExe ? path.resolve(options.root, target) : '';
  const processName = isExe ? path.basename(exe, '.exe') : target;

  function running(): boolean {
    if (!processName) return false;
    const result = run('powershell', ['-NoProfile', '-Command', `@(Get-Process -Name '${processName}' -ErrorAction SilentlyContinue).Count`]);
    return Number(firstLine(result.stdout)) > 0;
  }

  return {
    platform: 'windows',

    async available(): Promise<Availability> {
      if (process.platform !== 'win32') return {ready: false, reason: 'this is not a Windows machine'};
      if (!processName) {
        return {ready: false, reason: `no app to drive: build one (scripts/windows-ci.sh) and pass --target <exe or process name>`};
      }
      if (!running()) {
        const where = exe ? path.relative(options.root, exe) : processName;
        return {ready: false, found: where, reason: `${processName} is not running${exe ? `; start ${where}` : ''}`};
      }
      return {ready: true, found: `${processName} is running`};
    },

    async open(to: string): Promise<StepResult> {
      // A second launch with the link as its argument: the app's single-instance
      // check redirects it to the window already open, as React Native's `url`
      // event. Without an exe there is nothing to launch.
      const url = /^[a-z]+:/i.test(to) ? to : `${options.scheme ?? processName.toLowerCase()}://${to.replace(/^\//, '')}`;
      if (!exe) return failed(`cannot open ${url}: no exe to launch (pass --target <exe>)`);
      const child = spawn(exe, [url], {cwd: path.dirname(exe), detached: true, stdio: 'ignore', windowsHide: false});
      child.unref();
      return ok(`sent ${url} to ${processName}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const out = prepare(file);
      const result = powershell(script('screen.ps1'), ['-Out', out, ...(processName ? ['-Process', processName] : [])]);
      if (!result.ok) return failed(`screenshot failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(firstLine(result.stdout).replace(out, path.relative(options.root, out)));
    },

    async tap(x: number, y: number): Promise<StepResult> {
      const result = powershell(script('input.ps1'), ['-Points', `${x},${y}`, ...(processName ? ['-Process', processName] : [])]);
      if (!result.ok) return failed(`press failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(firstLine(result.stdout));
    },

    async type(text: string): Promise<StepResult> {
      const result = powershell(script('input.ps1'), ['-Keys', text]);
      if (!result.ok) return failed(`typing failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(`typed ${JSON.stringify(text)}`);
    },

    async tree(): Promise<StepResult> {
      if (!processName) return failed('no app to read: pass --target <exe or process name>');
      const result = powershell(script('uia.ps1'), ['-Process', processName]);
      if (!result.ok) return failed(`could not read the tree: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(`read the UI Automation tree of ${processName}`, result.stdout.trim());
    },

    async idleSeconds(): Promise<number | null> {
      const result = powershell(script('idle.ps1'));
      const seconds = Number(firstLine(result.stdout));
      return Number.isFinite(seconds) ? seconds : null;
    },

    async close(): Promise<void> {},
  };
}

/** Brings the app to the front, which synthetic input needs and screenshots do not. */
export function raiseWindows(processName: string): StepResult {
  if (!processName) return elsewhere('raising a window', 'windows', 'no process was named');
  const result = powershell(script('raise.ps1'), ['-Process', processName]);
  return result.ok ? ok(firstLine(result.stdout)) : failed(firstLine(result.stderr) || 'could not raise the window');
}
