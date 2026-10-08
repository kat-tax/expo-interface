import type {BottomSheetContentPadding} from '@expo/ui';
import {createContext, useContext, useState} from 'react';
import {Platform, useWindowDimensions} from 'react-native';
import {horizontalInset} from './shared';

/** The width of a sheet on an iPad, where it is a form sheet rather than the window's width. */
const FORM_SHEET_WIDTH = 540;

/**
 * The widest an Android sheet grows: Material 3's
 * `BottomSheetDefaults.SheetMaxWidth`, which `@expo/ui`'s `ModalBottomSheet`
 * keeps. On a tablet, a foldable or a phone in landscape the sheet is
 * narrower than the window.
 */
const MATERIAL_SHEET_MAX_WIDTH = 640;

/**
 * iOS and Android: the width the platform's sheet gives its content inside
 * its padding, as the sheet's column measured it, or undefined before the
 * first measurement.
 */
export const SheetContentWidthContext = createContext<number | undefined>(undefined);

/**
 * iOS and Android: the width the sheet's column measured, and the handler
 * its size modifier reports to. A width of zero, from a pass before the
 * sheet is laid out, is not kept.
 */
export function useSheetContentWidth(): [number | undefined, (size: {width: number}) => void] {
  const [width, setWidth] = useState<number>();
  const onSize = (size: {width: number}) => {
    if (size.width > 0) setWidth(size.width);
  };
  return [width, onSize];
}

/**
 * iOS and Android: the width React Native content hosted in the sheet takes
 * (a capped body, the footer). A React Native view inside the platform's
 * sheet has no width of its own to fill, so its box is told the sheet's:
 * the width the sheet's column measured, which follows a rotation, the safe
 * areas of a sheet in landscape, an inset sheet and an app's own
 * `presentationSizing`. Until that arrives it is worked out from the
 * window: the window's width, at most a form sheet's on an iPad or
 * Material's limit for a sheet on Android, less the sheet's own padding on
 * both sides.
 */
export function useSheetBodyWidth(contentPadding: BottomSheetContentPadding | undefined): number | '100%' {
  const measured = useContext(SheetContentWidthContext);
  const {width} = useWindowDimensions();
  if (measured !== undefined) return measured;
  const limit = Platform.OS === 'ios' ? (Platform.isPad ? FORM_SHEET_WIDTH : width) : MATERIAL_SHEET_MAX_WIDTH;
  return Math.min(width, limit) - horizontalInset(contentPadding);
}
