import {TurboModuleRegistry} from 'react-native';
import {clearCrashes, getLastCrash, installCrashHandler, recordError} from './crashes';
import {ExpoWindows} from './window';

const REPORT = {type: 'native', timestamp: '2026-09-18T14:00:00.000Z', message: 'Unhandled exception 0xC0000005 at 0x1 in ExpoWindows.dll', code: 3221225477, dump: 'C:\\x\\crashes\\a.dmp'};

function withLibrary(text: string | null = JSON.stringify(REPORT)) {
  const crashes = {record: vi.fn(() => true), getLastCrash: vi.fn(async () => text), clearCrashes: vi.fn(async () => {}), crash: vi.fn()};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsCrashes' ? crashes : null) as never);
  return crashes;
}

describe('crash reports (windows)', () => {
  it('records a fatal error ahead of the handler that was there, and leaves the others to it', () => {
    const crashes = withLibrary();
    const previous = vi.fn();
    let handler: ((error: unknown, isFatal?: boolean) => void) | undefined;
    installCrashHandler({getGlobalHandler: () => previous, setGlobalHandler: next => { handler = next; }});
    const fatal = new Error('boom');
    handler?.(fatal, true);
    expect(crashes.record).toHaveBeenCalledWith('javascript', 'boom', fatal.stack);
    expect(previous).toHaveBeenCalledWith(fatal, true);
    handler?.(new Error('soft'), false);
    expect(crashes.record).toHaveBeenCalledTimes(1);
    expect(previous).toHaveBeenCalledTimes(2);
    handler?.('a string', true);
    expect(crashes.record).toHaveBeenLastCalledWith('javascript', 'a string', '');
    handler?.(null, true);
    expect(crashes.record).toHaveBeenLastCalledWith('javascript', 'null', '');
  });

  it('installs nothing without ErrorUtils, and a handler that has no previous one runs alone', () => {
    const crashes = withLibrary();
    installCrashHandler(undefined);
    installCrashHandler({} as never);
    let handler: ((error: unknown, isFatal?: boolean) => void) | undefined;
    installCrashHandler({getGlobalHandler: () => undefined as never, setGlobalHandler: next => { handler = next; }});
    handler?.(new Error('alone'), true);
    expect(crashes.record).toHaveBeenCalledTimes(1);
  });

  it('answers with the last report parsed, null for none or a broken one, and clears them', async () => {
    const crashes = withLibrary();
    await expect(getLastCrash()).resolves.toEqual(REPORT);
    await expect(ExpoWindows.getLastCrashAsync()).resolves.toEqual(REPORT);
    await clearCrashes();
    await ExpoWindows.clearCrashesAsync();
    expect(crashes.clearCrashes).toHaveBeenCalledTimes(2);
    withLibrary(null);
    await expect(getLastCrash()).resolves.toBeNull();
    withLibrary('{not json');
    await expect(getLastCrash()).resolves.toBeNull();
  });

  it('records nothing and knows of no crash without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(recordError(new Error('x'))).toBe(false);
    await expect(getLastCrash()).resolves.toBeNull();
    await expect(clearCrashes()).resolves.toBeUndefined();
  });
});
