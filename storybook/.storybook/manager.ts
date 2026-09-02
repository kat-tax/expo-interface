import {addons} from 'storybook/manager-api';
import {preferredTheme} from './theme';

addons.setConfig({
  theme: preferredTheme(),
  sidebar: {
    showRoots: true,
  },
});
