/**
 * `react-native` on the web Storybook. react-native-web has no `PlatformColor`,
 * but the kit (and `expo-symbols`) import it and only call it on iOS and
 * Android. Metro leaves such an import undefined; strict ESM in the browser
 * throws on a missing named export, so re-export react-native-web with a
 * stand-in that behaves like the web branch (a plain color string).
 */
export * from 'react-native-web';

/** @param {...string} names */
export function PlatformColor(...names) {
  return names[0];
}
