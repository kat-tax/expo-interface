import {useSyncExternalStore} from 'react';

/** Whether the page runs never changes while it does, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/** What the page answers once it runs. */
function clientHydrated(): boolean {
  return true;
}

/** What a static export's server answers, and the render that hydrates its HTML: nothing runs on the page yet. */
function serverHydrated(): boolean {
  return false;
}

/**
 * Whether the page is running. A static export's server renders the page
 * inside the whole `+html` document, where this is false; the browser
 * hydrates `#root` alone with a render that answers false as well, so it
 * matches the server's HTML; and every render after that answers true. A
 * page rendered on the client alone (the dev server, a test) answers true
 * from its first render.
 *
 * React keeps a server attribute the hydration render disagrees with rather
 * than patch it, so what the server cannot write as the client would waits
 * for this: a menu's ids, which `useId` answers differently on each side,
 * and a trigger's `popovertarget`, so a press before the bundle runs opens
 * nothing rather than a list with no anchor and entries that do nothing yet.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, clientHydrated, serverHydrated);
}
