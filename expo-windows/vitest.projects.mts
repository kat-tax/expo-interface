import {expoProjects, nodeProject} from '../expo-vitest/src/index.ts';

/**
 * The runtime's test projects, from the folder it is in.
 *
 * Its JavaScript, the modules an Expo package finds on Windows, runs on the
 * Windows project: the React Native engine told it is Windows, resolving
 * `.windows.*` files first. The runtime is for Windows alone, so every test
 * there is a Windows test whatever its name. No module is forbidden: these
 * tests import the Expo packages to prove they load.
 *
 * Its Metro config and CLI are Node code and run as a plain Node project.
 */
export function runtimeProjects(root: string) {
  return [
    ...expoProjects({root, platforms: ['windows'], windows: {name: 'expo-windows', include: ['src/**/*.test.{ts,tsx}']}}),
    nodeProject({root, name: 'expo-windows-node', include: ['{metro,cli}/**/*.test.{js,ts}']}),
  ];
}
