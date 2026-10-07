import {ACCENT_SEED, onAccent} from './accent';
import {SCHEME_BACKGROUND} from './backgrounds';

/**
 * Concrete scheme palette. These are the values `useColor` resolves on iOS
 * and Android (visual parity with web), the `default` of every `theme`
 * token, and the values emitted as CSS custom properties by `getThemeCSS`
 * on web. Native Compose controls on Android (text fields, switches,
 * pickers, dialogs) are themed separately by the accent-seeded Material 3
 * Host palette (`seedColor` on the Screen `Host`).
 *
 * `tint`/`onTint` derive from the accent seed (see `accent.tsx`) — a single
 * color for both schemes, like a single-color iOS AccentColor asset.
 */
export const colors = {
  light: {
    label: '#000000',
    secondaryLabel: '#60646C',
    tertiaryLabel: '#9094A0',
    background: SCHEME_BACKGROUND.light,
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    separator: 'rgba(60, 60, 67, 0.29)',
    tint: ACCENT_SEED,
    onTint: onAccent(ACCENT_SEED),
    pillBackground: 'rgba(118, 118, 128, 0.12)',
    segmentSelected: '#FFFFFF',
    switchTrack: '#e9e9ea',
    switchOn: '#34C759',
    success: '#34C759',
    destructive: '#FF3B30',
    onDestructive: '#FFFFFF',
    highlight: '#FFF1B8',
    opaqueSeparator: '#C6C6C8',
  },
  dark: {
    label: '#ffffff',
    secondaryLabel: '#B0B4BA',
    tertiaryLabel: '#6E7378',
    background: SCHEME_BACKGROUND.dark,
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    separator: 'rgba(84, 84, 88, 0.6)',
    tint: ACCENT_SEED,
    onTint: onAccent(ACCENT_SEED),
    pillBackground: 'rgba(118, 118, 128, 0.24)',
    segmentSelected: '#636366',
    switchTrack: '#39393d',
    switchOn: '#30D158',
    success: '#30D158',
    destructive: '#FF453A',
    onDestructive: '#FFFFFF',
    highlight: '#4D4000',
    opaqueSeparator: '#38383A',
  },
} as const;
