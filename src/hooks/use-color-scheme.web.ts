import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

/**
 * Subscribes to OS-level color scheme changes via the `prefers-color-scheme`
 * media query.
 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * Reads the current scheme synchronously on the client. Because this runs
 * during the hydration commit (before the browser paints), the correct value
 * is applied immediately with no light-mode flash.
 */
function getSnapshot(): 'light' | 'dark' {
  return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/** Static rendering has no media query, so default to light on the server. */
function getServerSnapshot(): 'light' {
  return 'light';
}

export function useColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
