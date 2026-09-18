import {native} from '../native';

/** What the app left behind when it died: the report `getLastCrash` answers with. */
export interface CrashReport {
  type: 'native' | 'javascript';
  /** When, as ISO 8601 in UTC. */
  timestamp: string;
  message: string;
  /** The JavaScript stack, for a JavaScript error. */
  stack?: string;
  /** The exception code, for a native fault. */
  code?: number;
  /** The minidump's path, for a native fault; open it in Visual Studio or WinDbg. */
  dump?: string;
}

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;

/** React Native's `ErrorUtils`: the global error handler every uncaught JavaScript error reaches. */
export interface ErrorUtilsLike {
  getGlobalHandler(): ErrorHandler;
  setGlobalHandler(handler: ErrorHandler): void;
}

/** Writes a report of a JavaScript error through the library, now; false without it. */
export function recordError(error: unknown): boolean {
  const {message, stack} = (error ?? {}) as {message?: unknown; stack?: unknown};
  const text = typeof message === 'string' ? message : String(error);
  return native.crashes()?.record('javascript', text, typeof stack === 'string' ? stack : '') ?? false;
}

/**
 * Puts a handler in front of React Native's global one that records a
 * fatal JavaScript error before the instance goes down; nothing where
 * there is no `ErrorUtils` (a test runner).
 */
export function installCrashHandler(errorUtils: ErrorUtilsLike | undefined = (globalThis as {ErrorUtils?: ErrorUtilsLike}).ErrorUtils): void {
  if (!errorUtils?.getGlobalHandler || !errorUtils.setGlobalHandler) return;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) recordError(error);
    previous?.(error, isFatal);
  });
}

/** The newest crash report, or null when there is none — or no library. */
export async function getLastCrash(): Promise<CrashReport | null> {
  const text = await native.crashes()?.getLastCrash();
  if (!text) return null;
  try {
    return JSON.parse(text) as CrashReport;
  } catch {
    return null;
  }
}

export async function clearCrashes(): Promise<void> {
  await native.crashes()?.clearCrashes();
}
