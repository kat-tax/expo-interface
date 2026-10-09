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
 * `overlayMaterial`, else `none`.
 */
export function useOverlayMaterial(own?: MaterialThickness): MaterialThickness {
  const app = useContext(OverlayMaterialContext);
  return own ?? app ?? 'none';
}
