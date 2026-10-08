import type {BottomSheetContentPadding} from '@expo/ui';
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
 * iOS and Android: the width React Native content hosted in the sheet takes
 * (a capped body, the footer). A React Native view inside the platform's
 * sheet has no width of its own to fill, so its box is told the sheet's:
 * the window's width, at most a form sheet's on an iPad or Material's limit
 * for a sheet on Android, less the sheet's own padding on both sides.
 */
export function useSheetBodyWidth(contentPadding: BottomSheetContentPadding | undefined): number | '100%' {
  const {width} = useWindowDimensions();
  const sheet = Math.min(width, Platform.OS === 'ios' ? FORM_SHEET_WIDTH : MATERIAL_SHEET_MAX_WIDTH);
  return sheet - horizontalInset(contentPadding);
}
