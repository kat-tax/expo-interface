import type {Preview} from '@storybook/react-native';
import type {PropsWithChildren} from 'react';
import {Host} from '@expo/ui';
import {Platform, StyleSheet, View} from 'react-native';
import {withBackgrounds} from '@storybook/addon-ondevice-backgrounds';
import {AccentProvider, getThemeCSS, hostAccentProps, useAccentSeed, useColor} from 'expo-interface';

// The kit's web styling is driven by CSS custom properties that an app emits
// from `+html.tsx`; the Storybook app has no HTML template, so inject them.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = getThemeCSS();
  document.head.appendChild(style);
}

/**
 * Mirrors what `Screen` does for a story: paints the scheme background and,
 * for `native` stories, mounts an accent-seeded `@expo/ui` `Host` so SwiftUI /
 * Compose controls can render. Stories built from plain React Native views
 * (typography, headers, QR codes) opt out with `parameters: {native: false}`.
 */
function Frame({native, children}: PropsWithChildren<{native: boolean}>) {
  const seed = useAccentSeed();
  const backgroundColor = useColor('background');
  return (
    <View style={[styles.frame, {backgroundColor}]}>
      {native ? <Host style={styles.host} {...hostAccentProps(seed)}>{children}</Host> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {flex: 1, padding: 16},
  host: {flex: 1},
});

const preview: Preview = {
  decorators: [
    withBackgrounds,
    (Story, {parameters}) => (
      <AccentProvider seed={parameters.accent}>
        <Frame native={parameters.native !== false}>
          <Story/>
        </Frame>
      </AccentProvider>
    ),
  ],
  parameters: {
    /** Wrap the story in an accent-seeded `@expo/ui` `Host`. */
    native: true,
    /** Accent seed passed to `AccentProvider`; omit for the default. */
    accent: undefined,
    backgrounds: {
      default: 'none',
      values: [
        {name: 'none', value: 'transparent'},
        {name: 'light', value: '#ffffff'},
        {name: 'dark', value: '#000000'},
      ],
    },
  },
};

export default preview;
