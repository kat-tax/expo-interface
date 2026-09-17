import {native} from '../native';

type KeepAwakeEvent = {state: 'RELEASE'};
type KeepAwakeListener = (event: KeepAwakeEvent) => void;

const tags = new Set<string>();
const listeners = new Map<string, Set<KeepAwakeListener>>();

/** The display is kept awake while any tag is active. */
function apply(): void {
  native.power()?.setKeepAwake(tags.size > 0);
}

/**
 * `ExpoKeepAwake`, what `expo-keep-awake` — and the dev tools `expo`
 * wraps every root component in during development — activates through:
 * the display and the system kept awake, through the runtime's power
 * library, while any tag is active; a tag's listeners hear `RELEASE` when
 * it is deactivated. Without the library the tags are taken without
 * effect, and the feature reported unavailable.
 */
export const ExpoKeepAwake = {
  async isAvailableAsync(): Promise<boolean> {
    return native.power() !== null;
  },
  async activate(tag: string): Promise<void> {
    tags.add(tag);
    apply();
  },
  async deactivate(tag: string): Promise<void> {
    if (!tags.delete(tag)) return;
    apply();
    for (const listener of listeners.get(tag) ?? []) listener({state: 'RELEASE'});
  },
  addListenerForTag(tag: string, listener: KeepAwakeListener): {remove(): void} {
    const set = listeners.get(tag) ?? new Set<KeepAwakeListener>();
    set.add(listener);
    listeners.set(tag, set);
    return {
      remove() {
        set.delete(listener);
        if (set.size === 0) listeners.delete(tag);
      },
    };
  },
};
