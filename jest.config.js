/**
 * The kit resolves a different implementation per platform (`index.ios.tsx`,
 * `index.android.tsx`, `index.web.tsx` / `index.tsx`), so the suite runs once
 * per platform using the `jest-expo` platform presets. Test files pick their
 * platforms by name:
 *
 * - `*.test.ts(x)`          every platform
 * - `*.native.test.tsx`     iOS and Android
 * - `*.ios.test.tsx`        iOS only
 * - `*.android.test.tsx`    Android only
 * - `*.web.test.tsx`        web only
 */
const shared = {
  roots: ['<rootDir>/src'],
  clearMocks: true,
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/style-mock.js',
  },
};

const native = {
  ...shared,
  setupFilesAfterEnv: ['<rootDir>/jest/setup.native.ts'],
};

module.exports = {
  projects: [
    {
      ...native,
      displayName: 'ios',
      preset: 'jest-expo/ios',
      testPathIgnorePatterns: ['/node_modules/', '\\.web\\.test\\.', '\\.android\\.test\\.'],
    },
    {
      ...native,
      displayName: 'android',
      preset: 'jest-expo/android',
      testPathIgnorePatterns: ['/node_modules/', '\\.web\\.test\\.', '\\.ios\\.test\\.'],
    },
    {
      ...shared,
      displayName: 'web',
      preset: 'jest-expo/web',
      setupFilesAfterEnv: ['<rootDir>/jest/setup.web.ts'],
      testPathIgnorePatterns: ['/node_modules/', '\\.native\\.test\\.', '\\.ios\\.test\\.', '\\.android\\.test\\.'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/**/*.test.{ts,tsx}',
    '!src/__stories__/**',
    '!src/__tests__/**',
    '!src/**/*.d.ts',
  ],
};
