import type {Preview} from '@storybook/react-native';
import {AccentProvider} from 'expo-interface';
import {Frame, frameParameters, injectThemeCSS} from '../src/frame';

injectThemeCSS();

/**
 * No `withBackgrounds` here: that decorator wraps the story in its own
 * `View`, which would sit between the `Host` and the story's Compose views
 * and break the composition boundary on Android. `Frame` paints the scheme
 * background instead.
 */
const preview: Preview = {
  decorators: [
    (Story, {parameters}) => (
      <AccentProvider seed={parameters.accent}>
        <Frame native={parameters.native !== false}>
          <Story/>
        </Frame>
      </AccentProvider>
    ),
  ],
  parameters: {
    ...frameParameters,
  },
};

export default preview;
