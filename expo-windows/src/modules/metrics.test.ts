import {createAppMetricsModule, createObserveModule} from './metrics';

describe('ExpoAppMetrics (windows)', () => {
  it('takes marks, events and errors without keeping them, and has one empty main session', async () => {
    const metrics = createAppMetricsModule() as ReturnType<typeof createAppMetricsModule> & {
      NetworkRequestObserver: new () => object;
      Session: new (type?: string) => {id: string; type: string; startDate: string; isActive(): Promise<boolean>; getEndDate(): Promise<null>; getMetrics(): Promise<never[]>; getLogs(): Promise<never[]>; addMetric(): Promise<void>};
      markFirstRender(): Promise<void>;
      markInteractive(): Promise<void>;
      logEvent(): void;
      setGlobalAttributes(): void;
      clearStoredEntries(): Promise<void>;
      getInactiveSessions(): Promise<never[]>;
      reportError(): void;
      getForegroundSession(): Promise<null>;
    };
    expect(new metrics.NetworkRequestObserver()).toBeInstanceOf(globalThis.expo.SharedObject);
    const session = new metrics.Session();
    expect(session.type).toBe('main');
    expect(session.id).toBe('windows-session');
    expect(Date.parse(session.startDate)).not.toBeNaN();
    await expect(session.isActive()).resolves.toBe(true);
    await expect(session.getEndDate()).resolves.toBeNull();
    await expect(session.getMetrics()).resolves.toEqual([]);
    await expect(session.getLogs()).resolves.toEqual([]);
    await expect(session.addMetric()).resolves.toBeUndefined();
    expect(new metrics.Session('foreground').type).toBe('foreground');
    await expect(metrics.markFirstRender()).resolves.toBeUndefined();
    await expect(metrics.markInteractive()).resolves.toBeUndefined();
    expect(metrics.logEvent()).toBeUndefined();
    expect(metrics.setGlobalAttributes()).toBeUndefined();
    await expect(metrics.clearStoredEntries()).resolves.toBeUndefined();
    await expect(metrics.getInactiveSessions()).resolves.toEqual([]);
    expect(metrics.reportError()).toBeUndefined();
    const main = metrics.getMainSession();
    expect(main.type).toBe('main');
    expect(metrics.getMainSession()).toBe(main);
    await expect(metrics.getForegroundSession()).resolves.toBeNull();
  });
});

describe('ExpoObserve (windows)', () => {
  it('takes every call without effect and has no integrations', async () => {
    const observe = createObserveModule() as ReturnType<typeof createObserveModule> & Record<string, () => unknown>;
    await expect(observe.dispatchEvents()).resolves.toBeUndefined();
    for (const method of ['configure', 'registerIntegration', 'logEvent', 'reportError', 'markFirstRender', 'markInteractive', 'setGlobalAttributes', 'setBundleDefaults']) {
      expect(observe[method](), method).toBeUndefined();
    }
    expect(observe.getIntegrations()).toEqual({});
  });
});
