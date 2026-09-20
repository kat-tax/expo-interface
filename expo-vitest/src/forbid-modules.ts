import type {Plugin} from 'vite';

const PREFIX = '\0expo-vitest:forbidden:';

/** What importing a forbidden module says. */
export function forbiddenMessage(name: string, platform: string): string {
  return `${name} has no ${platform} implementation and must not be imported by a file that loads there.`;
}

/**
 * Makes importing any of `names` throw, for the modules that have no
 * implementation on a platform. Such a module usually calls
 * `requireNativeModule` as it loads and throws without the native side, so a
 * component that imports one kills an app before its first render, whatever
 * else it does. A test that imports the component then fails with the
 * module's name, rather than passing on an engine that happens to have it.
 *
 * Type-only imports are erased before this sees them and stay fine. A test
 * can still `vi.mock` a forbidden module for itself: the mock is registered
 * against the same id the imports resolve to.
 *
 * A resolver rather than `vi.mock`, which has to be written out once per
 * module because Vitest hoists it: a list can be handed to this one.
 */
export function forbidModules(names: string[], platform = 'Windows'): Plugin {
  const forbidden = new Set(names);
  return {
    name: 'expo-vitest:forbid-modules',
    enforce: 'pre',
    resolveId(source) {
      return forbidden.has(source) ? PREFIX + source : null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      return `throw new Error(${JSON.stringify(forbiddenMessage(id.slice(PREFIX.length), platform))});`;
    },
  };
}
