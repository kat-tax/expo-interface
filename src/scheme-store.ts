import {Appearance} from 'react-native';

/** The scheme the app is drawn in. */
export type ColorScheme = 'light' | 'dark';

/**
 * The color scheme as an external store, read through `Appearance`, which
 * `scheme.ts` patches on web and Windows to answer a forced scheme too. Kept
 * apart from `scheme.ts` so the accent can follow the scheme without
 * importing the theme, which itself imports the accent.
 */
export function subscribeScheme(onChange: () => void): () => void {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
}

/** The scheme now: `'light'` or `'dark'`, never unspecified. */
export function schemeSnapshot(): ColorScheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/**
 * The scheme a static web export was rendered in, which hydration has to
 * match: the server has no scheme to read, so it renders light, and the
 * client renders light first and then the scheme it reads. Natively there
 * is no hydration and this is never asked.
 */
export function serverScheme(): ColorScheme {
  return 'light';
}
