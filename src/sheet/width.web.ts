import type {BottomSheetContentPadding} from '@expo/ui';

/** Web: the drawer is a box of the DOM's, which a body fills by asking for all of it. */
export function useSheetBodyWidth(_contentPadding: BottomSheetContentPadding | undefined): number | '100%' {
  return '100%';
}
