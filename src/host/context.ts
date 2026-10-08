import {createContext, useContext} from 'react';

/** True below a native host — see {@link useNativeHost}. */
export const NativeHostContext = createContext(false);

/**
 * Whether this point in the tree is already inside a native host: a
 * `NativeHost`, a `Screen native`, a `Sheet`'s native content (its bar, its
 * accessory and a body without `maxHeight`). On iOS and Android a capped
 * body and the footer of a `Sheet` are React Native content, where it is
 * false. Components that present natively (`Alert`) mount a host of their
 * own when there is none, so they can be rendered anywhere; nesting hosts
 * is not allowed.
 */
export function useNativeHost(): boolean {
  return useContext(NativeHostContext);
}
