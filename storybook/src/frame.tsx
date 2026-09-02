import type {PropsWithChildren} from 'react';
import {Host} from '@expo/ui';
import {Platform, StyleSheet, View} from 'react-native';
import {colors, getThemeCSS, hostAccentProps, useAccentSeed, useColor} from 'expo-interface';

/**
 * Story parameters understood by the `Frame` decorator, shared by the web
 * (`.storybook`) and on-device (`.rnstorybook`) Storybooks.
 */
export interface FrameParameters {
  /** Wrap the story in an accent-seeded `@expo/ui` `Host`. */
  native?: boolean;
  /** Accent seed passed to `AccentProvider`; omit for the default. */
  accent?: string;
}

export const frameParameters = {
  native: true,
  accent: undefined,
} satisfies FrameParameters;

/**
 * Mirrors what `Screen` does for a story: paints the scheme background and,
 * for `native` stories, mounts an accent-seeded `@expo/ui` `Host` so SwiftUI /
 * Compose controls can render. Stories built from plain React Native views
 * (typography, headers, QR codes) opt out with `parameters: {native: false}`.
 */
export function Frame({native, fill = true, children}: PropsWithChildren<{native: boolean; fill?: boolean}>) {
  const seed = useAccentSeed();
  const backgroundColor = useColor('background');
  return (
    <View style={[styles.frame, fill && styles.fill, {backgroundColor}]}>
      {native ? <Host style={styles.host} {...hostAccentProps(seed)}>{children}</Host> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {padding: 16},
  fill: {flex: 1, minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : undefined},
  host: {flex: 1},
});

const toKebab = (s: string) => s.replace(/[A-Z]/g, v => `-${v.toLowerCase()}`);
const renderVars = (palette: Record<string, string>) =>
  Object.entries(palette).map(([k, v]) => `--color-${toKebab(k)}: ${v};`).join(' ');

/**
 * The kit's web styling is driven by CSS custom properties that an app emits
 * from `+html.tsx`; Storybook has no HTML template, so inject them. Also adds
 * `[data-theme]` overrides so the Storybook toolbar can force a light or dark
 * palette regardless of the OS `prefers-color-scheme` (the attribute @expo/ui
 * uses for the same purpose; `.storybook/globals.ts` sets it). `color-scheme`
 * is forced along with the variables so `light-dark()` in the kit's CSS
 * follows too. Storybook's "preparing" overlay, shown while a story or docs
 * page loads, is hard-coded white; painting it with the scheme background
 * keeps it from flashing in the dark palette.
 */
export function injectThemeCSS() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('expo-interface-theme')) return;
  const style = document.createElement('style');
  style.id = 'expo-interface-theme';
  style.textContent = `${getThemeCSS()}
    :root[data-theme="light"] { color-scheme: light; ${renderVars(colors.light)} }
    :root[data-theme="dark"] { color-scheme: dark; ${renderVars(colors.dark)} }
    .sb-preparing-story, .sb-preparing-docs { background-color: var(--color-background); }
  `;
  document.head.appendChild(style);
}
