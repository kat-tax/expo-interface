/**
 * Extra `Host` props that apply the accent seed to the native UI toolkit.
 * Resolved per platform by Metro:
 * - `.android.ts`: `{seedColor}` — themes all Compose children with the
 *   seeded Material 3 palette and publishes it via `HostPaletteContext`.
 * - `.ios.ts`: `{modifiers: [tint(seed)]}` — cascades the accent to all
 *   SwiftUI children (standard `.tint` inheritance).
 * - Web (this file): nothing; the accent flows through CSS custom properties.
 *
 * Typed loosely because `seedColor`/`modifiers` are platform-entry props that
 * the universal `Host` type does not declare.
 */
export function hostAccentProps(_seed: string): Record<string, never> {
  return {};
}
