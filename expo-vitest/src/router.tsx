import type {ComponentType} from 'react';
import {Platform} from 'react-native';
import {ExpoRoot} from 'expo-router';
import {render} from '@testing-library/react';

/** In-memory `app/` directory: route name (`_layout`, `index`, `settings`) to screen. */
export type Routes = Record<string, ComponentType<any>>;

// `Stack` measures its header with a `ResizeObserver` on web; jsdom has none.
if (Platform.OS === 'web' && typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * `require.context` stub over `routes` — the same shape expo-router's
 * `inMemoryContext` builds. Inlined because the web project can import
 * neither `vitest-expo/router` nor `expo-router/build/testing-library/*`:
 * both graphs reach Node-resolved TypeScript sources (e.g.
 * `expo/src/dom/global-events`) that the jsdom pipeline cannot load.
 */
function inMemoryContext(routes: Routes) {
  return Object.assign(
    (id: string) => ({default: routes[id.replace(/^\.\//, '').replace(/\.\w*$/, '')]}),
    {
      resolve: (key: string) => key,
      id: '0',
      keys: () => Object.keys(routes).map(key => `./${key}.js`),
    },
  );
}

/**
 * Mounts an expo-router app built from `routes` at `initialUrl`.
 *
 * Native goes through `vitest-expo/router`'s `renderRouter` (React Native
 * Testing Library), imported lazily so the web project never loads it. Web
 * renders `ExpoRoot` into the DOM with `@testing-library/react` instead,
 * because RNTL's renderer produces no DOM for the react-native-web output.
 * Query with RNTL's `screen` on native and `@testing-library/react`'s on web.
 */
export async function renderApp(routes: Routes, initialUrl = '/') {
  if (Platform.OS === 'web') {
    render(<ExpoRoot context={inMemoryContext(routes)} location={initialUrl}/>);
  } else {
    const {renderRouter} = await import('vitest-expo/router');
    await renderRouter(routes, {initialUrl});
  }
}
