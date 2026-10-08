/** The device's language, kept with the formatter that reported it. */
let device: {format: typeof Intl.DateTimeFormat; language: string} | null = null;

/**
 * The device's language, as the engine's `Intl.DateTimeFormat` reports it,
 * which Hermes has. It is read once, not on every render of every time, and
 * again only if the formatter is replaced.
 */
function deviceLanguage(): string | undefined {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') return undefined;
  if (device?.format !== Intl.DateTimeFormat) {
    device = {format: Intl.DateTimeFormat, language: new Intl.DateTimeFormat().resolvedOptions().locale};
  }
  return device.language;
}

/**
 * The language relative times are said in when no `locale` is given. iOS,
 * Android and Windows have no page to declare one, so it is the device's.
 * Hermes has no `Intl.RelativeTimeFormat`, and a polyfill for it says the
 * language it is handed: the device's, rather than the polyfill's default.
 */
export function useDefaultLanguage(): string | undefined {
  return deviceLanguage();
}
