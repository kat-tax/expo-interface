import {useSyncExternalStore} from 'react';

/** Hears the page's `lang` change, which an app that switches language at run time does on `<html>`. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  return () => observer.disconnect();
}

/** The `lang` of the page's `<html>`; none when it is empty, which no formatter takes. */
export function pageLanguage(): string | undefined {
  return document.documentElement.lang || undefined;
}

/** A server has no page to read: a static export is rendered in the engine's language. */
function serverLanguage(): undefined {
  return undefined;
}

/**
 * Web: the language the page declares, the `lang` of its `<html>` (the app
 * config's `web.lang`, or the one `+html.tsx` sets), kept current. A static
 * export hydrates with the server's words, which had no page to read, and
 * switches to the page's in the next render, so hydration matches the HTML.
 */
export function usePageLanguage(): string | undefined {
  return useSyncExternalStore(subscribe, pageLanguage, serverLanguage);
}
