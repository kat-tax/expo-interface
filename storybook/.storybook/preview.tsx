import type {Preview} from '@storybook/react-native-web-vite';
import {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AccentProvider} from 'expo-interface';
import {Frame, frameParameters, injectThemeCSS} from '../src/frame';
import {preferredTheme} from './theme';

injectThemeCSS();

/** Applies the toolbar's scheme choice to the `[data-scheme]` CSS overrides. */
function Scheme({value}: {value?: string}) {
  useEffect(() => {
    const root = document.documentElement;
    if (value === 'light' || value === 'dark') root.dataset.scheme = value;
    else delete root.dataset.scheme;
  }, [value]);
  return null;
}

const preview: Preview = {
  decorators: [
    // `SafeAreaProvider` is what an Expo Router root (and the on-device
    // Storybook UI) provides; `Screen` reads insets from it.
    (Story, {parameters, globals, viewMode}) => (
      <SafeAreaProvider>
        <AccentProvider seed={parameters.accent}>
          <Scheme value={globals.scheme}/>
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
  },
  initialGlobals: {
    scheme: 'system',
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
      theme: preferredTheme(),
      codePanel: true,
    },
    options: {
      storySort: {
        order: ['Introduction', 'Guides', ['Theming', 'Icons', 'Development'], 'Layout', 'Components'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
