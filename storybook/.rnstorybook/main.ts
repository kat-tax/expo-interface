import type {StorybookConfig} from '@storybook/react-native';

const main: StorybookConfig = {
  stories: ['../../src/**/*.stories.?(ts|tsx)'],
  // No backgrounds addon: its decorator inserts a `View` between the `Host`
  // and the story's Compose views (see `preview.tsx`).
  deviceAddons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
    '@storybook/addon-ondevice-notes',
  ],
};

export default main;
