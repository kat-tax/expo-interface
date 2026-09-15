/**
 * The barrel is what an app imports, so every module it reaches must load on
 * Windows. The Windows project forbids the modules that have no Windows
 * implementation (`vitest/setup.windows.ts`): a component that imports one
 * at load — as `ExternalLink` once did with `expo-web-browser` — kills an app
 * before its first render, whatever the islands do. Importing the whole
 * barrel under that rule is the guard.
 */
describe('expo-interface (windows)', () => {
  it('forbids a module without a Windows implementation', async () => {
    // Vitest wraps a throwing mock factory; the guard's error is the cause.
    const forbidden = {cause: {message: expect.stringContaining('no Windows implementation')}};
    await expect(import('expo-web-browser')).rejects.toMatchObject(forbidden);
    await expect(import('@expo/ui')).rejects.toMatchObject(forbidden);
  });

  it('imports the whole barrel without one', async () => {
    const kit = await import('./index');
    const missing = Object.entries(kit).filter(([, value]) => value === undefined).map(([name]) => name);
    expect(missing).toEqual([]);
    expect(kit.ExternalLink).toEqual(expect.any(Function));
    expect(kit.Stack).toEqual(expect.any(Function));
  });
});
