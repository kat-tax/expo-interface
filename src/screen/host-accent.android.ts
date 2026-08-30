/**
 * Android: seed the Compose `Host` so all Material 3 children are themed by
 * the accent-derived palette (`SchemeTonalSpot`), and no-arg
 * `useMaterialColors()` calls inside the subtree read the same palette.
 */
export function hostAccentProps(seed: string) {
  return {seedColor: seed};
}
