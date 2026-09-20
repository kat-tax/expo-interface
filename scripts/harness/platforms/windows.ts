import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {firstLine, powershell, prepare, run} from '../lib/run.ts';
import type {Point, Snapshot, SnapshotNode, Target} from '../lib/snapshot.ts';
import {asSelector, centreOf, describeTarget, findNode, isPoint} from '../lib/snapshot.ts';
import type {Availability, Driver, DriverOptions, SnapshotOptions, StepResult} from '../lib/types.ts';
import {failed, ok} from '../lib/types.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..', 'windows');

/** Where a built app tends to be, when nobody said. */
const GUESSES = ['example/windows/x64/Release', 'example/windows/x64/Debug', 'windows/x64/Release', 'windows/x64/Debug'];

function findExe(root: string): string | null {
  for (const guess of GUESSES) {
    const directory = path.join(root, guess);
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(directory).filter(entry => entry.endsWith('.exe'));
    } catch {
      continue;
    }
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
 * from the screen, presses from synthetic input, and the tree from UI
 * Automation, which is what Narrator reads.
 *
 * It answers `agent-device`'s shape — snapshot, press, fill — because
 * `agent-device` has no Windows backend and a test should not have to care
 * which of the two is underneath.
 *
 * Synthetic input goes to whatever is in front. If the user is at the desk it
 * lands in their window instead, so the CLI checks how long the machine has
 * been idle before pressing anything.
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

  async function snapshot(snapshotOptions: SnapshotOptions = {}): Promise<Snapshot> {
    const result = powershell(script('snapshot.ps1'), ['-Process', processName, ...(snapshotOptions.interactive ? ['-Interactive'] : [])]);
    if (!result.ok) throw new Error(`could not read the tree of ${processName}: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    const parsed = JSON.parse(result.stdout) as {process: string; nodes: (SnapshotNode & {testId?: string | null})[]};
    // PowerShell writes a null for a control with no AutomationId; the node
    // shape says a testId is a string or is not there at all.
    const nodes = (parsed.nodes ?? []).map(({testId, ...node}) => (testId ? {...node, testId} : node));
    return {platform: 'windows', source: parsed.process, nodes};
  }

  /** The point a target names, resolved against a fresh tree. */
  async function pointFor(what: Target): Promise<{point: Point; note: string}> {
    const selector = asSelector(what);
    if (isPoint(selector)) return {point: selector, note: `${selector.x},${selector.y}`};
    const tree = await snapshot();
    const node = findNode(tree, selector);
    if (!node) throw new Error(`nothing matches ${describeTarget(what)} in the window (${tree.nodes.length} nodes)`);
    const point = centreOf(node);
    if (!point) throw new Error(`${node.ref} ${node.role} ${JSON.stringify(node.name)} has no bounds to press`);
    return {point, note: `${node.ref} ${node.role} ${JSON.stringify(node.name)}`};
  }

  function click(point: Point): StepResult {
    // Synthetic input goes to the foreground window, so the app has to be it.
    // A test should not have to remember that, and a press into whatever
    // happens to be in front is the failure this whole harness exists to avoid.
    if (processName) powershell(script('raise.ps1'), ['-Process', processName]);
    const result = powershell(script('input.ps1'), ['-Points', `${point.x},${point.y}`, ...(processName ? ['-Process', processName] : [])]);
    return result.ok ? ok(firstLine(result.stdout)) : failed(`press failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
  }

  return {
    platform: 'windows',

    async available(): Promise<Availability> {
      if (process.platform !== 'win32') return {ready: false, reason: 'this is not a Windows machine'};
      if (!processName) return {ready: false, reason: 'no app to drive: build one (scripts/windows-ci.sh) and pass --target <exe or process name>'};
      if (!running()) {
        const where = exe ? path.relative(options.root, exe) : processName;
        return {ready: false, found: where, reason: `${processName} is not running${exe ? `; start ${where}` : ''}`};
      }
      return {ready: true, found: `${processName} is running`};
    },

    async open(to: string): Promise<StepResult> {
      // A second launch with the link as its argument: the app's single-instance
      // check redirects it to the window already open, as React Native's `url` event.
      const url = /^[a-z]+:/i.test(to) ? to : `${options.scheme ?? processName.toLowerCase()}://${to.replace(/^\//, '')}`;
      if (!exe) return failed(`cannot open ${url}: no exe to launch (pass --target <exe>)`);
      const child = spawn(exe, [url], {cwd: path.dirname(exe), detached: true, stdio: 'ignore'});
      child.unref();
      return ok(`sent ${url} to ${processName}`);
    },

    snapshot,

    async press(what: Target): Promise<StepResult> {
      try {
        const {point, note} = await pointFor(what);
        const result = click(point);
        return result.ok ? ok(`pressed ${note}`) : result;
      } catch (error) {
        return failed((error as Error).message);
      }
    },

    async fill(what: Target, text: string): Promise<StepResult> {
      try {
        const {point, note} = await pointFor(what);
        const pressed = click(point);
        if (!pressed.ok) return pressed;
        const typed = powershell(script('input.ps1'), ['-Keys', text]);
        return typed.ok ? ok(`filled ${note} with ${JSON.stringify(text)}`) : failed(`typing failed: ${firstLine(typed.stderr)}`);
      } catch (error) {
        return failed((error as Error).message);
      }
    },

    async type(text: string): Promise<StepResult> {
      const result = powershell(script('input.ps1'), ['-Keys', text]);
      return result.ok ? ok(`typed ${JSON.stringify(text)}`) : failed(`typing failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const out = prepare(file);
      const result = powershell(script('screen.ps1'), ['-Out', out, ...(processName ? ['-Process', processName] : [])]);
      if (!result.ok) return failed(`screenshot failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
      return ok(firstLine(result.stdout).replace(out, path.relative(options.root, out)));
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
  if (!processName) return failed('no process was named to raise');
  const result = powershell(script('raise.ps1'), ['-Process', processName]);
  return result.ok ? ok(firstLine(result.stdout)) : failed(firstLine(result.stderr) || 'could not raise the window');
}
