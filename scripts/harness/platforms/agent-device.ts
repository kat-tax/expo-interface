import path from 'node:path';
import {firstLine, prepare, run} from '../lib/run.ts';
import type {Snapshot, SnapshotNode, Target} from '../lib/snapshot.ts';
import {asSelector, describeTarget, isPoint} from '../lib/snapshot.ts';
import type {Availability, Driver, DriverOptions, Platform, SnapshotOptions, StepResult} from '../lib/types.ts';
import {failed, ok} from '../lib/types.ts';

/** What `agent-device` calls the platforms we care about. */
const PLATFORM_NAMES: Partial<Record<Platform, string>> = {ios: 'ios', android: 'android', web: 'web'};

/** A node as `agent-device` reports it (`@agent-device/kernel/snapshot`). */
interface AgentNode {
  ref?: string;
  role?: string;
  type?: string;
  label?: string;
  value?: string;
  identifier?: string;
  rect?: {x?: number; y?: number; width?: number; height?: number};
  enabled?: boolean;
  focused?: boolean;
  depth?: number;
  hittable?: boolean;
  visibleToUser?: boolean;
}

/** Their node in our shape, so a test reads the same whichever backend answered. */
export function toSnapshotNode(node: AgentNode, index: number): SnapshotNode {
  const ref = node.ref ? (node.ref.startsWith('@') ? node.ref : `@${node.ref}`) : `@e${index + 1}`;
  const rect = node.rect;
  return {
    ref,
    role: node.role ?? node.type ?? '',
    name: node.label ?? node.value ?? node.identifier ?? '',
    depth: node.depth ?? 0,
    interactive: node.hittable ?? false,
    focused: node.focused,
    enabled: node.enabled,
    offscreen: node.visibleToUser === false,
    bounds:
      rect && typeof rect.x === 'number' && typeof rect.width === 'number'
        ? {x: Math.round(rect.x), y: Math.round(rect.y ?? 0), width: Math.round(rect.width), height: Math.round(rect.height ?? 0)}
        : null,
  };
}

/** The nodes inside whatever shape the command answered with. */
export function nodesFrom(payload: unknown): AgentNode[] {
  if (Array.isArray(payload)) return payload as AgentNode[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['nodes', 'elements', 'tree', 'snapshot', 'data', 'result']) {
      const found = nodesFrom(record[key]);
      if (found.length) return found;
    }
  }
  return [];
}

/** A target in the spelling `agent-device` takes on its command line. */
export function toAgentTarget(what: Target): string {
  const selector = asSelector(what);
  if (isPoint(selector)) return `${selector.x} ${selector.y}`;
  if (selector.ref) return selector.ref;
  if (selector.label) return `label="${selector.label}"`;
  if (selector.role) return `role="${selector.role}"`;
  if (selector.contains) return `label="${selector.contains}"`;
  return describeTarget(what);
}

/**
 * `agent-device` (callstack) driving iOS, Android and its own web backend. It
 * does far more than this adapter asks of it — video, logs, traces, network,
 * React profiles — but the harness only needs the shape every platform shares,
 * so a test written once runs on Windows too, where `agent-device` has no
 * backend at all.
 *
 * Installed separately (`npm i -g agent-device`); `available()` says so when
 * it is missing rather than failing a step.
 */
export function agentDeviceDriver(platform: Platform, options: DriverOptions): Driver {
  const name = PLATFORM_NAMES[platform] ?? platform;
  const base = ['--platform', name, ...(options.target ? ['--device', options.target] : [])];

  function agent(args: string[]) {
    return run('agent-device', [...args, ...base], {cwd: options.root, timeout: 180_000});
  }

  function parse(stdout: string): unknown {
    try {
      return JSON.parse(stdout);
    } catch {
      // Some commands print a line of prose before the payload.
      const brace = stdout.indexOf('{');
      const bracket = stdout.indexOf('[');
      const at = brace < 0 ? bracket : bracket < 0 ? brace : Math.min(brace, bracket);
      if (at < 0) return null;
      try {
        return JSON.parse(stdout.slice(at));
      } catch {
        return null;
      }
    }
  }

  return {
    platform,

    async available(): Promise<Availability> {
      const version = run('agent-device', ['--version'], {timeout: 60_000});
      if (version.missing) return {ready: false, reason: 'agent-device is not installed; `npm i -g agent-device` adds it'};
      const capabilities = agent(['capabilities']);
      if (!capabilities.ok) return {ready: false, reason: firstLine(capabilities.stderr) || `agent-device has no ${name} target ready`};
      return {ready: true, found: firstLine(capabilities.stdout) || `agent-device ${firstLine(version.stdout)}`};
    },

    async open(to: string): Promise<StepResult> {
      const result = agent(['open', to]);
      return result.ok ? ok(`opened ${to}`) : failed(`could not open ${to}: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async snapshot(snapshotOptions: SnapshotOptions = {}): Promise<Snapshot> {
      const result = agent(['snapshot', ...(snapshotOptions.interactive ? ['-i'] : []), '--json']);
      if (!result.ok) throw new Error(firstLine(result.stderr) || 'agent-device could not take a snapshot');
      const nodes = nodesFrom(parse(result.stdout)).map(toSnapshotNode);
      return {platform, source: options.target ?? name, nodes};
    },

    async press(what: Target): Promise<StepResult> {
      const result = agent(['press', toAgentTarget(what)]);
      return result.ok ? ok(`pressed ${describeTarget(what)}`) : failed(`press failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async fill(what: Target, text: string): Promise<StepResult> {
      const result = agent(['fill', toAgentTarget(what), text]);
      return result.ok ? ok(`filled ${describeTarget(what)}`) : failed(`fill failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async type(text: string): Promise<StepResult> {
      const result = agent(['type', text]);
      return result.ok ? ok(`typed ${JSON.stringify(text)}`) : failed(`typing failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async screenshot(file: string): Promise<StepResult> {
      const out = prepare(file);
      const result = agent(['screenshot', out]);
      return result.ok ? ok(`saved ${path.relative(options.root, out)}`) : failed(`screenshot failed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
    },

    async idleSeconds(): Promise<number | null> {
      // A device or an emulator is not this machine's desktop.
      return null;
    },

    async close(): Promise<void> {
      run('agent-device', ['close', ...base], {timeout: 60_000});
    },
  };
}
