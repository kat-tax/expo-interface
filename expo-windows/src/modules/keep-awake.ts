/**
 * `ExpoKeepAwake`, what `expo-keep-awake` — and the dev tools `expo`
 * wraps every root component in during development — activates through.
 * A desktop does not sleep on an idle app, so Windows reports the feature
 * unavailable and takes the tags without effect; a display request over
 * `Windows.System.Display` is a later C++ module.
 */
const tags = new Set<string>();

export const ExpoKeepAwake = {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async activate(tag: string): Promise<void> {
    tags.add(tag);
  },
  async deactivate(tag: string): Promise<void> {
    tags.delete(tag);
  },
  addListenerForTag(_tag: string, _listener: (event: {state: string}) => void): {remove(): void} {
    return {remove() {}};
  },
};
