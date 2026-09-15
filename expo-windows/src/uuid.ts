/**
 * Expo Modules Core's web polyfill takes `uuidv4` from `crypto.randomUUID`,
 * which Hermes does not have unless a polyfill installs it. Windows fills the
 * gap with the same v4 layout from `Math.random`, and keeps a real
 * `crypto.randomUUID` where one exists.
 */
export function uuidv4(): string {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID : null;
  if (random) return random.call(crypto);
  const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return hex.replace(/[xy]/g, character => {
    const value = Math.floor(Math.random() * 16);
    return (character === 'x' ? value : (value % 4) + 8).toString(16);
  });
}

/** Points the `expo` global's `uuidv4` at a generator that works on Hermes. */
export function installUuidFallback(): void {
  const expo = globalThis.expo;
  if (expo) expo.uuidv4 = uuidv4;
}
