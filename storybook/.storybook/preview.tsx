import type {Preview} from '@storybook/react-native-web-vite';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AccentProvider} from 'expo-interface';
import {Frame, frameParameters, injectThemeCSS} from '../src/frame';
import {ThemedDocsContainer} from './docs-container';
import {ACCENT_SEED, normalizeAccent} from './theme';
// Mirrors the scheme global to `<html data-theme>` and feeds the docs theme.
import './globals';

injectThemeCSS();

const preview: Preview = {
  decorators: [
    // `SafeAreaProvider` is what an Expo Router root (and the on-device
    // Storybook UI) provides; `Screen` reads insets from it.
    (Story, {parameters, globals, viewMode}) => (
      <SafeAreaProvider>
        <AccentProvider seed={normalizeAccent(globals.accent ?? parameters.accent)}>
          <Frame native={parameters.native !== false} fill={viewMode === 'story'}>
            <Story/>
          </Frame>
        </AccentProvider>
      </SafeAreaProvider>
    ),
  ],
  globalTypes: {
    scheme: {
      description: 'Color scheme of the preview',
      toolbar: {
        title: 'Scheme',
        icon: 'contrast',
        items: [
          {value: 'system', title: 'System', icon: 'browser'},
          {value: 'light', title: 'Light', icon: 'sun'},
          {value: 'dark', title: 'Dark', icon: 'moon'},
        ],
        dynamicTitle: true,
      },
    },
    // Set from the manager's accent picker (`.storybook/manager.tsx`), which
    // offers presets and a custom color; no toolbar menu of its own.
    accent: {
      description: 'Accent seed passed to `AccentProvider`',
    },
  },
  initialGlobals: {
    scheme: 'system',
    accent: ACCENT_SEED,
  },
  parameters: {
    ...frameParameters,
    // The frame paints the scheme background itself.
    layout: 'fullscreen',
    backgrounds: {disable: true},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      container: ThemedDocsContainer,
      codePanel: true,
    },
    options: {
      storySort: {
        order: ['Overview', 'Guides', ['Installation', 'Theming', 'Icons'], 'Layout', 'Components'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
