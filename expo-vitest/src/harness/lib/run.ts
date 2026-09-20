import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface Ran {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
  /** Set when the program could not be started at all (it is not installed). */
  missing?: boolean;
}

/**
 * Runs a program with its arguments handed over as they are — no shell, so a
 * path with a space in it (every tool under "Program Files") survives.
 */
export function run(command: string, args: string[], options: {cwd?: string; timeout?: number; input?: string} = {}): Ran {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    cwd: options.cwd,
    timeout: options.timeout ?? 120_000,
    input: options.input,
    windowsHide: true,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  // ENOENT is the program not being there, which callers report as "not installed"
  // rather than as a failure of the thing they were asked to do.
  const missing = Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT');
  return {ok: !missing && result.status === 0, status: result.status, stdout, stderr, missing};
}

/** Whether a program answers at all, for the doctor. */
export function installed(command: string, args: string[] = ['--version']): boolean {
  return !run(command, args, {timeout: 20_000}).missing;
}

/**
 * The same, for a program whose output is bytes rather than text — a PNG down
 * a pipe survives this and would not survive being decoded as UTF-8.
 */
export function runBinary(command: string, args: string[], options: {cwd?: string; timeout?: number} = {}): {ok: boolean; stdout: Buffer; stderr: string; missing?: boolean} {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    timeout: options.timeout ?? 120_000,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  const missing = Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT');
  return {
    ok: !missing && result.status === 0,
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: (result.stderr ?? Buffer.alloc(0)).toString('utf8'),
    missing,
  };
}

/**
 * Runs one of the harness's own PowerShell scripts by path. `-File` keeps the
 * arguments intact; a `-Command` string handed through a shell loses its quotes.
 */
export function powershell(script: string, args: string[] = []): Ran {
  return run('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, ...args]);
}

/** Makes sure a file's directory exists, and answers with the file. */
export function prepare(file: string): string {
  fs.mkdirSync(path.dirname(path.resolve(file)), {recursive: true});
  return path.resolve(file);
}

export function firstLine(text: string): string {
  return text.trim().split(/\r?\n/)[0] ?? '';
}
