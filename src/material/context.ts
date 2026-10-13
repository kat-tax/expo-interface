import type {MaterialThickness} from './types';
import {createContext, useContext} from 'react';

/**
 * The material the app's overlays draw on unless one of them is told
 * otherwise, which `AccentProvider` provides from its `overlayMaterial`.
 * Nothing until the app sets it.
 */
export const OverlayMaterialContext = createContext<MaterialThickness | undefined>(undefined);

/**
 * The material an overlay draws on: its own, else the app's
 * `overlayMaterial` (the one `AccentProvider` is given), else `none`. The
 * kit's overlays read it for their `material`, and an app does the same for
 * a popup it draws itself: a `Surface` given `useOverlayMaterial()` as its
 * `material` follows the app-wide default as the kit's menus and popovers
 * do, and one given its own thickness keeps it.
 */
export function useOverlayMaterial(own?: MaterialThickness): MaterialThickness {
  const app = useContext(OverlayMaterialContext);
  return own ?? app ?? 'none';
}
