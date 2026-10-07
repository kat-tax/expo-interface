import type {BottomSheetContentPadding} from '@expo/ui';
import {Platform, useWindowDimensions} from 'react-native';
import {horizontalInset} from './shared';

/** The width of a sheet on an iPad, where it is a form sheet rather than the window's width. */
const FORM_SHEET_WIDTH = 540;

/**
 * iOS and Android: the width a React Native body inside the sheet takes.
 * The sheet's content is React Native's inside the platform's sheet, and a
 * React Native view there has no width of its own to fill, so the body is
 * told the sheet's: the window's width, or a form sheet's on an iPad, less
 * the sheet's own padding on both sides.
 */
export function useSheetBodyWidth(contentPadding: BottomSheetContentPadding | undefined): number | '100%' {
  const {width} = useWindowDimensions();
  const sheet = Platform.OS === 'ios' ? Math.min(width, FORM_SHEET_WIDTH) : width;
  return sheet - horizontalInset(contentPadding);
}
