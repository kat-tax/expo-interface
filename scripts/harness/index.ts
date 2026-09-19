/**
 * The harness: run the kit on a platform, drive it, and look at what it drew.
 *
 *   node scripts/harness/index.ts doctor
 *   node scripts/harness/index.ts -p web open / screenshot home.png tree
 *   node scripts/harness/index.ts -p windows --target example/windows/x64/Release/DropFiles.exe \
 *       open /detail wait 1000 screenshot detail.png
 *
 * Steps run in order in one session, so a sequence is a flow rather than four
 * disconnected commands. Every platform answers every step: what a platform has
 * no counterpart for is reported and skipped, not failed, so the same script
 * runs everywhere and tells you what it could not do.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {androidDriver} from './platforms/android.ts';
import {iosDriver} from './platforms/ios.ts';
import {webDriver} from './platforms/web.ts';
import {raiseWindows, windowsDriver} from './platforms/windows.ts';
import type {Driver, DriverOptions, Platform, StepResult} from './lib/types.ts';
import {PLATFORMS, elsewhere, failed, ok} from './lib/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = '.harness';

/** How long the machine must have been quiet before the harness presses anything. */
const QUIET_SECONDS = 180;

const DRIVERS: Record<Platform, (options: DriverOptions) => Driver> = {
  web: webDriver,
  windows: windowsDriver,
  android: androidDriver,
  ios: iosDriver,
};

const USAGE = `the harness — run the kit on a platform and look at what it drew

  node scripts/harness/index.ts doctor
  node scripts/harness/index.ts -p <platform> [options] <step>...

platforms   ${PLATFORMS.join(', ')}

steps       open <path|url>     a route, as a deep link or a URL
            screenshot <file>   a PNG, under ${OUT}/ unless the path says otherwise
            tap <x> <y>         a press, in the window's own pixels from its top left
            type <text>         into whatever has focus
            tree                the accessibility tree, as a screen reader reads it
            raise               bring the app to the front (desktop only)
            wait <ms>           let something settle
            idle                how long the machine has been quiet

options     --url <url>         where the app is served (web; default http://localhost:8081)
            --scheme <scheme>   the app's URI scheme for deep links
            --target <what>     the device, simulator, exe or process to drive
            --out <dir>         where screenshots go (default ${OUT})
            --force             press even when someone is using the machine
`;

interface Options {
  platform?: Platform;
  url?: string;
  scheme?: string;
  target?: string;
  out: string;
  force: boolean;
  steps: string[][];
  command: 'doctor' | 'run' | 'help';
}

const STEP_ARGUMENTS: Record<string, number> = {open: 1, screenshot: 1, tap: 2, type: 1, tree: 0, raise: 0, wait: 1, idle: 0};

export function parse(argv: string[]): Options {
  const options: Options = {out: OUT, force: false, steps: [], command: 'run'};
  const rest: string[] = [];
  for (let at = 0; at < argv.length; at++) {
    const argument = argv[at] ?? '';
    const value = () => argv[++at] ?? '';
    if (argument === '--platform' || argument === '-p') options.platform = value() as Platform;
    else if (argument === '--url') options.url = value();
    else if (argument === '--scheme') options.scheme = value();
    else if (argument === '--target') options.target = value();
    else if (argument === '--out') options.out = value();
    else if (argument === '--force') options.force = true;
    else if (argument === '--help' || argument === '-h') options.command = 'help';
    else if (argument === 'doctor') options.command = 'doctor';
    else rest.push(argument);
  }
  // The rest is a sequence of steps, each taking a known number of arguments.
  for (let at = 0; at < rest.length; at++) {
    const name = rest[at] ?? '';
    const takes = STEP_ARGUMENTS[name];
    if (takes === undefined) throw new Error(`${name} is not a step; try --help`);
    const args = rest.slice(at + 1, at + 1 + takes);
    if (args.length < takes) throw new Error(`${name} takes ${takes} argument${takes === 1 ? '' : 's'}`);
    options.steps.push([name, ...args]);
    at += takes;
  }
  return options;
}

/**
 * Git Bash rewrites an argument that looks like an absolute POSIX path into one
 * under its own installation before the harness ever sees it, so `open /detail`
 * arrives as `C:/Program Files/Git/detail`. The shell says where it lives, so
 * this undoes it exactly rather than guessing.
 */
export function unmangleRoute(value: string, environment: NodeJS.ProcessEnv = process.env): string {
  const exe = environment.EXEPATH;
  if (!environment.MSYSTEM || !exe) return value;
  const root = path.dirname(exe).replace(/\\/g, '/');
  const normalized = value.replace(/\\/g, '/');
  if (!normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`)) return value;
  return `/${normalized.slice(root.length + 1)}`;
}

/** Where a screenshot lands: under the out directory unless the step named a path of its own. */
function screenshotPath(file: string, out: string): string {
  if (path.isAbsolute(file) || file.includes('/') || file.includes('\\')) return file;
  return path.join(out, file);
}

async function guard(driver: Driver, options: Options, what: string): Promise<StepResult | null> {
  if (options.force) return null;
  const idle = await driver.idleSeconds();
  if (idle === null || idle >= QUIET_SECONDS) return null;
  return failed(
    `refusing ${what}: someone used this machine ${Math.round(idle)} seconds ago, and synthetic input goes to whatever is in front. ` +
      `Leave it alone for ${QUIET_SECONDS} seconds, or pass --force.`,
  );
}

async function step(driver: Driver, options: Options, [name, ...args]: string[]): Promise<StepResult> {
  switch (name) {
    case 'open':
      return driver.open(unmangleRoute(args[0] ?? ''));
    case 'screenshot':
      return driver.screenshot(path.resolve(ROOT, screenshotPath(args[0] ?? 'screen.png', options.out)));
    case 'tap': {
      const refusal = await guard(driver, options, 'a press');
      return refusal ?? driver.tap(Number(args[0]), Number(args[1]));
    }
    case 'type': {
      const refusal = await guard(driver, options, 'typing');
      return refusal ?? driver.type(args[0] ?? '');
    }
    case 'tree':
      return driver.tree();
    case 'raise':
      if (driver.platform !== 'windows') return elsewhere('raising a window', driver.platform);
      return raiseWindows(options.target && options.target.toLowerCase().endsWith('.exe') ? path.basename(options.target, '.exe') : (options.target ?? ''));
    case 'wait':
      await new Promise(resolve => setTimeout(resolve, Number(args[0])));
      return ok(`waited ${args[0]} ms`);
    case 'idle': {
      const idle = await driver.idleSeconds();
      return idle === null ? ok('idleness does not apply to this platform') : ok(`quiet for ${Math.round(idle)} seconds`);
    }
    default:
      return failed(`${name} is not a step`);
  }
}

async function doctor(): Promise<number> {
  console.log('what this machine can drive:\n');
  for (const platform of PLATFORMS) {
    const driver = DRIVERS[platform]({root: ROOT});
    const state = await driver.available();
    await driver.close();
    const mark = state.ready ? 'yes' : 'no ';
    console.log(`  ${mark}  ${platform.padEnd(8)} ${state.ready ? (state.found ?? '') : (state.reason ?? '')}`);
  }
  console.log('\nnothing here changes your machine; a "no" says what is missing.');
  return 0;
}

async function main(argv: string[]): Promise<number> {
  let options: Options;
  try {
    options = parse(argv);
  } catch (error) {
    console.error(`${(error as Error).message}`);
    return 2;
  }
  if (options.command === 'help') {
    console.log(USAGE);
    return 0;
  }
  if (options.command === 'doctor') return doctor();
  if (!options.platform || !PLATFORMS.includes(options.platform)) {
    console.error(`name a platform with --platform (${PLATFORMS.join(', ')}), or run \`doctor\` to see what this machine can drive`);
    return 2;
  }
  if (options.steps.length === 0) {
    console.log(USAGE);
    return 0;
  }

  const driver = DRIVERS[options.platform]({root: ROOT, url: options.url, scheme: options.scheme, target: options.target});
  const state = await driver.available();
  if (!state.ready) {
    console.error(`${options.platform}: ${state.reason}`);
    await driver.close();
    return 1;
  }
  console.log(`${options.platform}: ${state.found ?? 'ready'}`);

  let failures = 0;
  try {
    for (const current of options.steps) {
      let result: StepResult;
      try {
        result = await step(driver, options, current);
      } catch (error) {
        result = failed(`${current[0]} threw: ${(error as Error).message}`);
      }
      const mark = result.skipped ? '–' : result.ok ? '·' : '✗';
      console.log(`  ${mark} ${result.message}`);
      if (result.output) console.log(result.output.replace(/^/gm, '      '));
      if (!result.ok) {
        failures++;
        break;
      }
    }
  } finally {
    await driver.close();
  }
  return failures === 0 ? 0 : 1;
}

main(process.argv.slice(2)).then(
  code => process.exit(code),
  error => {
    console.error(error);
    process.exit(1);
  },
);
