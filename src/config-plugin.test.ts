import {createRequire} from 'node:module';
import path from 'node:path';
import {SCHEME_BACKGROUND} from './backgrounds';

const require = createRequire(import.meta.url);
// eslint-disable-next-line typescript/no-require-imports -- the plugin is the CommonJS module Expo loads.
const withExpoInterface = require('../app.plugin.js') as (config: Config, options?: {light?: string; dark?: string}) => Config;
// eslint-disable-next-line typescript/no-require-imports -- expo-system-ui's plugin, which prebuild applies to every app.
const withSystemUI = (require('expo-system-ui/app.plugin.js') as {default: (config: Config) => Config}).default;

type Mod = (config: unknown) => Promise<{modResults: unknown}>;

interface Config {
  name: string;
  slug: string;
  backgroundColor?: string;
  android?: {backgroundColor?: string};
  ios?: {backgroundColor?: string};
  plugins?: (string | [string, unknown])[];
  _internal?: {projectRoot: string; pluginHistory?: Record<string, unknown>};
  mods?: {android?: Record<string, Mod>; ios?: Record<string, Mod>};
}

/** An Android resource file, as the mods read and write it. */
interface Resources {
  resources: {color?: {$: {name: string}; _: string}[]; style?: {$: {name: string}; item: {$: {name: string}; _: string}[]}[]};
}

const projectRoot = path.resolve(__dirname, '..');
const base = (more: Partial<Config> = {}): Config => ({name: 'app', slug: 'app', _internal: {projectRoot}, ...more});

/**
 * Runs the mods registered for one file over its contents, as prebuild
 * would: with the config, since a mod may read its colors from it.
 */
async function run(config: Config, platform: 'android' | 'ios', mod: string, modResults: unknown) {
  const {mods, ...rest} = config;
  const result = await mods![platform]![mod]!({...rest, modResults, modRequest: {platform, modName: mod, projectRoot}});
  return result.modResults;
}

/** The values a color file gives the window, expo-system-ui's `activityBackground`. */
const windowColors = (file: Resources) => (file.resources.color ?? []).filter(color => color.$.name === 'activityBackground').map(color => color._);

/** The window's day and night colors and the app's theme, after the Android mods. */
async function android(config: Config) {
  const day = await run(config, 'android', 'colors', {resources: {}}) as Resources;
  const night = await run(config, 'android', 'colorsNight', {resources: {}}) as Resources;
  const styles = await run(config, 'android', 'styles', {resources: {style: [{$: {name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar'}, item: []}]}}) as Resources;
  return {day: windowColors(day), night: windowColors(night), theme: styles.resources.style![0].item};
}

describe('the config plugin', () => {
  it('paints Android\'s window in the kit\'s background for each scheme, and leaves iOS\'s root view to the app', async () => {
    const config = withExpoInterface(base());
    expect(config.backgroundColor).toBeUndefined();
    expect(config.android?.backgroundColor).toBe(SCHEME_BACKGROUND.light);
    const {day, night, theme} = await android(config);
    expect(day).toEqual([SCHEME_BACKGROUND.light]);
    expect(night).toEqual([SCHEME_BACKGROUND.dark]);
    expect(theme).toContainEqual({$: {name: 'android:windowBackground'}, _: '@color/activityBackground'});
    // With no color of the app's own, expo-system-ui starts the root view in the system's color for the scheme.
    expect(await run(withSystemUI(withExpoInterface(base())), 'ios', 'infoPlist', {})).not.toHaveProperty('RCTRootViewBackgroundColor');
  });

  it('keeps Android\'s window whichever side of expo-system-ui it runs on', async () => {
    for (const config of [withSystemUI(withExpoInterface(base())), withExpoInterface(withSystemUI(base()))]) {
      const {day, night, theme} = await android(config);
      expect(day).toEqual([SCHEME_BACKGROUND.light]);
      expect(night).toEqual([SCHEME_BACKGROUND.dark]);
      expect(theme).toContainEqual({$: {name: 'android:windowBackground'}, _: '@color/activityBackground'});
    }
  });

  it('gives the launch screen both colors through expo-splash-screen, unless the app configures it', () => {
    const config = withExpoInterface(base(), {light: '#fafafa', dark: '#111111'});
    expect(config._internal!.pluginHistory).toHaveProperty('expo-splash-screen');
    expect(config.android?.backgroundColor).toBe('#fafafa');
    const own = withExpoInterface(base({plugins: [['expo-splash-screen', {backgroundColor: '#123456'}]]}));
    expect(own._internal!.pluginHistory ?? {}).not.toHaveProperty('expo-splash-screen');
  });

  it('keeps the app\'s own colors, and leaves out a launch screen the app cannot build', async () => {
    const config = withExpoInterface(base({backgroundColor: '#eeeeee', android: {backgroundColor: '#dddddd'}, _internal: {projectRoot: path.parse(projectRoot).root}}));
    expect(config.backgroundColor).toBe('#eeeeee');
    expect(config.android?.backgroundColor).toBe('#dddddd');
    expect((await android(config)).day).toEqual(['#dddddd']);
    expect(config._internal!.pluginHistory ?? {}).not.toHaveProperty('expo-splash-screen');
    // An app's top-level color is Android's window, and iOS's root view through expo-system-ui.
    const top = withSystemUI(withExpoInterface(base({backgroundColor: '#eeeeee'})));
    expect((await android(top)).day).toEqual(['#eeeeee']);
    expect(await run(top, 'ios', 'infoPlist', {})).toHaveProperty('RCTRootViewBackgroundColor', 0xffeeeeee);
  });
});
