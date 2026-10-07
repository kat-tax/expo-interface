import type {SheetMaterial} from '../sheet/types';
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

/** True below a stack header the screens run under — see {@link useFloatingHeader}. */
export const FloatingHeaderContext = createContext(false);

/**
 * Whether the stack header above this point is one the screens run under: a
 * `TabStack` with a `material` on iOS, whose bar is translucent over the
 * content. A `Screen` below it leaves the header's height clear at the top,
 * or lets its content pass under the bar with `underBar`, padding that
 * content by `useTabBarInset()`.
 */
export function useFloatingHeader(): boolean {
  return useContext(FloatingHeaderContext);
}

/**
 * The material of the floating stack header above this point (`TabStack
 * material`), which a row floating under it (`HeaderAccessory`) is drawn in;
 * `none` under an opaque header.
 */
export const HeaderMaterialContext = createContext<SheetMaterial>('none');
