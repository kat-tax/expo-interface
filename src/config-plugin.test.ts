import {createRequire} from 'node:module';
import path from 'node:path';
import {SCHEME_BACKGROUND} from './backgrounds';

const require = createRequire(import.meta.url);
// eslint-disable-next-line typescript/no-require-imports -- the plugin is the CommonJS module Expo loads.
const withExpoInterface = require('../app.plugin.js') as (config: Config, options?: {light?: string; dark?: string}) => Config;

interface Config {
  name: string;
  slug: string;
  backgroundColor?: string;
  android?: {backgroundColor?: string};
  plugins?: (string | [string, unknown])[];
  _internal?: {projectRoot: string; pluginHistory?: Record<string, unknown>};
  mods?: {android?: Record<string, (config: unknown) => Promise<{modResults: unknown}>>};
}

const projectRoot = path.resolve(__dirname, '..');
const base = (more: Partial<Config> = {}): Config => ({name: 'app', slug: 'app', _internal: {projectRoot}, ...more});

/** Runs one of the plugin's Android mods over an empty resource file, as prebuild would. */
async function run(config: Config, mod: 'colors' | 'colorsNight' | 'styles', modResults: unknown) {
  const result = await config.mods!.android![mod]!({modResults, modRequest: {platform: 'android', modName: mod, projectRoot}, _internal: config._internal});
  return result.modResults as {resources: {color?: {$: {name: string}; _: string}[]; style?: {$: {name: string}; item: {$: {name: string}; _: string}[]}[]}};
}

describe('the config plugin', () => {
  it('paints the window in the kit\'s background for each scheme, and the theme takes it', async () => {
    const config = withExpoInterface(base());
    expect(config.backgroundColor).toBe(SCHEME_BACKGROUND.light);
    const day = await run(config, 'colors', {resources: {}});
    expect(day.resources.color).toContainEqual({$: {name: 'activityBackground'}, _: SCHEME_BACKGROUND.light});
    const night = await run(config, 'colorsNight', {resources: {}});
    expect(night.resources.color).toContainEqual({$: {name: 'activityBackground'}, _: SCHEME_BACKGROUND.dark});
    const styles = await run(config, 'styles', {resources: {style: [{$: {name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar'}, item: []}]}});
    expect(styles.resources.style![0].item).toContainEqual({$: {name: 'android:windowBackground'}, _: '@color/activityBackground'});
  });

  it('gives the launch screen both colors through expo-splash-screen, unless the app configures it', () => {
    const config = withExpoInterface(base(), {light: '#fafafa', dark: '#111111'});
    expect(config._internal!.pluginHistory).toHaveProperty('expo-splash-screen');
    const own = withExpoInterface(base({plugins: [['expo-splash-screen', {backgroundColor: '#123456'}]]}));
    expect(own._internal!.pluginHistory ?? {}).not.toHaveProperty('expo-splash-screen');
  });

  it('keeps the app\'s own colors, and leaves out a launch screen the app cannot build', async () => {
    const config = withExpoInterface(base({backgroundColor: '#eeeeee', android: {backgroundColor: '#dddddd'}, _internal: {projectRoot: path.parse(projectRoot).root}}));
    expect(config.backgroundColor).toBe('#eeeeee');
    expect((await run(config, 'colors', {resources: {}})).resources.color).toEqual([{$: {name: 'activityBackground'}, _: '#dddddd'}]);
    expect(config._internal!.pluginHistory ?? {}).not.toHaveProperty('expo-splash-screen');
  });
});
