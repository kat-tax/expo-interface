import type {ComponentType} from 'react';
import {Platform} from 'react-native';
import {ExpoRoot} from 'expo-router';
import {getMockContext, renderRouter} from 'expo-router/testing-library';
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
 * Mounts an expo-router app built from `routes` at `initialUrl`.
 *
 * Native goes through `renderRouter` (React Native Testing Library). Web
 * renders `ExpoRoot` into the DOM with `@testing-library/react` instead,
 * because RNTL's renderer rejects the text nodes react-native-web emits.
 * Query with RNTL's `screen` on native and `@testing-library/react`'s on web.
 */
export async function renderApp(routes: Routes, initialUrl = '/') {
  if (Platform.OS === 'web') {
    render(<ExpoRoot context={getMockContext(routes)} location={initialUrl}/>);
  } else {
    await renderRouter(routes, {initialUrl});
  }
}
