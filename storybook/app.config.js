const app = require('./app.json');

/**
 * Wraps `app.json` so the web export can be served from a sub-path (GitHub
 * Pages hosts the repo at `/expo-interface/`). Locally `EXPO_BASE_URL` is
 * unset and the app is served from `/`.
 */
module.exports = ({config}) => ({
  ...app.expo,
  ...config,
  experiments: {
    ...app.expo.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
});
