import {useSyncExternalStore} from 'react';

/** Every time on the page that hears its language change. */
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

/**
 * Hears the page's `lang` change, which an app that switches language at run
 * time does on `<html>`. One observer serves every time on the page, so a
 * list of them watches the attribute once; it goes when the last one does.
 */
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!observer) {
    observer = new MutationObserver(() => listeners.forEach(listener => listener()));
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    observer!.disconnect();
    observer = null;
  };
}

/** The `lang` of the page's `<html>`; none when it is empty, which no formatter takes. */
function pageLanguage(): string | undefined {
  return document.documentElement.lang || undefined;
}

/**
 * A server has no page to read, so it says the words in English, Expo's
 * default `web.lang`, rather than in the language of whichever engine runs:
 * the machine that builds a static export, then the browser that hydrates it.
 */
function serverLanguage(): string {
  return 'en';
}

/**
 * Web: the language the page declares, the `lang` of its `<html>` (the app
 * config's `web.lang`, or the one `+html.tsx` sets), kept current. A static
 * page's first render, which hydrates the server's HTML, answers English as
 * the server did, whatever the browser's language; the next render answers
 * the page's.
 */
export function usePageLanguage(): string | undefined {
  return useSyncExternalStore(subscribe, pageLanguage, serverLanguage);
}
