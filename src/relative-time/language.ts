/** The engine's locale, kept with the formatter that reported it. */
let device: {format: typeof Intl.DateTimeFormat; language: string} | null = null;

/**
 * The locale the engine's `Intl.DateTimeFormat` reports, which Hermes has.
 * It is read once, not on every render of every time, and again only if
 * the formatter is replaced.
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
 * Android and Windows have no page to declare one, so it is the locale
 * Hermes reports: on iOS the language the system runs the app in, which is
 * the device's only when the app is localized for it; on Android the
 * device's; on Windows the user's regional format. Hermes has no
 * `Intl.RelativeTimeFormat`, and a polyfill for it says the language it is
 * handed: this one, rather than the polyfill's default.
 */
export function useDefaultLanguage(): string | undefined {
  return deviceLanguage();
}
