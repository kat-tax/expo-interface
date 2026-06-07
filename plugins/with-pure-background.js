const {
  AndroidConfig,
  withAndroidStyles,
  withAndroidColors,
  withAndroidColorsNight,
  createRunOncePlugin,
} = require('expo/config-plugins');

const THEME_ATTRS = ['android:windowBackground', 'android:colorBackground'];
const COLOR_NAME = 'appBackground';
const LIGHT = '#FFFFFFFF';
const DARK = '#FF000000';

function withDayColor(config) {
  return withAndroidColors(config, cfg => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, {
      name: COLOR_NAME,
      value: LIGHT,
    });
    return cfg;
  });
}

function withNightColor(config) {
  return withAndroidColorsNight(config, cfg => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, {
      name: COLOR_NAME,
      value: DARK,
    });
    return cfg;
  });
}

function withThemeBackground(config) {
  return withAndroidStyles(config, cfg => {
    const parent = AndroidConfig.Styles.getAppThemeGroup();
    for (const name of THEME_ATTRS) {
      cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
        add: true,
        parent,
        name,
        value: `@color/${COLOR_NAME}`,
      });
    }
    return cfg;
  });
}

function withPureBackground(config) {
  config = withDayColor(config);
  config = withNightColor(config);
  config = withThemeBackground(config);
  return config;
}

module.exports = createRunOncePlugin(withPureBackground, 'with-pure-background', '1.0.0');
