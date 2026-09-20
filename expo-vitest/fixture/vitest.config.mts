import {defineConfig} from 'vitest/config';
import {expoProjects} from 'expo-vitest';

// By its name, not by a path: this is the package as an app installs it.
export default defineConfig({
  test: {
    projects: expoProjects({windows: {forbid: ['expo-image']}}),
  },
});
