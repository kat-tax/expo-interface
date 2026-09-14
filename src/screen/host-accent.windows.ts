/**
 * Windows: nothing. There is no `@expo/ui` host to seed; each XAML island
 * takes the accent through its own `accentColor` prop (`useXamlProps`).
 */
export function hostAccentProps(_seed: string): Record<string, never> {
  return {};
}
