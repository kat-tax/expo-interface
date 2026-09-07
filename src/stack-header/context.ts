import {createContext, useContext} from 'react';

/** True below a stack header — see {@link useStackHeader}. */
export const StackHeaderContext = createContext(false);

/**
 * Whether a stack header is drawn above this point in the tree. `TabStack`
 * sets it, so a `Screen` under one skips its own top inset without being
 * told (`Screen`'s `header` prop stays the override for a plain `Stack`).
 */
export function useStackHeader(): boolean {
  return useContext(StackHeaderContext);
}
