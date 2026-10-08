// The kit's config plugin: the launch screen and Android's window behind the
// app in the kit's background for each scheme, so nothing shows Expo's
// defaults before the first screen paints. In app.json: "plugins": ["expo-interface"],
// or ["expo-interface", {"light": "#fafafa", "dark": "#111111"}].
const {AndroidConfig, withAndroidColors, withAndroidColorsNight, withAndroidStyles, withPlugins} = require('expo/config-plugins');

/** The kit palette's `background` in each scheme (`src/backgrounds.ts`). */
const BACKGROUND = {light: '#ffffff', dark: '#000000'};

/** expo-system-ui's name for the window background, which the app theme takes as `android:windowBackground`. */
const WINDOW = 'activityBackground';

/** Whether the app lists a plugin itself, with options or without. */
function hasPlugin(config, name) {
  return (config.plugins ?? []).some(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) === name);
}

/** Whether the app can load a package, from its own folder. */
function canResolve(config, name) {
  try {
    require.resolve(`${name}/package.json`, {paths: [config._internal?.projectRoot ?? process.cwd()]});
    return true;
  } catch {
    return false;
  }
}

function withExpoInterface(config, {light = BACKGROUND.light, dark = BACKGROUND.dark} = {}) {
  // Android's window, in the light color unless the app gives its own.
  // expo-system-ui writes `android.backgroundColor` (or the top-level color)
  // to the same resource and removes it when there is none, so it is handed
  // the color too, whichever of the two runs last. The top-level color stays
  // the app's: expo-system-ui makes it iOS's root view, one color for both
  // schemes, and without it the root view starts in the system's white or
  // black for the scheme the app launches in.
  const day = config.android?.backgroundColor ?? config.backgroundColor ?? light;
  config.android = {...config.android, backgroundColor: day};
  config = withAndroidColors(config, mod => {
    mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, {name: WINDOW, value: day});
    return mod;
  });
  // Android takes a night resource: the window follows the scheme from launch.
  config = withAndroidColorsNight(config, mod => {
    mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, {name: WINDOW, value: dark});
    return mod;
  });
  config = withAndroidStyles(config, mod => {
    mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:windowBackground',
      value: `@color/${WINDOW}`,
    });
    return mod;
  });
  // The launch screen: expo-splash-screen's colors for each scheme, unless
  // the app configures it itself.
  if (!hasPlugin(config, 'expo-splash-screen') && canResolve(config, 'expo-splash-screen')) {
    config = withPlugins(config, [['expo-splash-screen', {backgroundColor: light, dark: {backgroundColor: dark}}]]);
  }
  return config;
}

module.exports = withExpoInterface;
