import type {BottomSheetContentPadding} from '@expo/ui';
import type {MenuItem} from '../menu/types';
import type {SheetAction, SheetMaterial} from './types';

/** What the bar draws. */
export interface SheetBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  menu?: MenuItem[];
  testID?: string;
}

/** What the row of actions draws. */
export interface SheetActionsProps {
  actions: SheetAction[];
  testID?: string;
}

/** A child's test identifier under the sheet's, when the sheet has one. */
export function sub(testID: string | undefined, name: string): string | undefined {
  return testID ? `${testID}-${name}` : undefined;
}

/** What the sheet's bar leaves at each end, so the title stays centred whichever end has a button. */
export const BAR_SIDE = 56;

/** The bar's height, in points. */
export const BAR_HEIGHT = 56;

/**
 * What the sheet's own padding takes from a body's width on both sides: the
 * platforms' default inset of 16 a side, or what `contentPadding` says.
 */
export function horizontalInset(contentPadding: BottomSheetContentPadding | undefined): number {
  if (contentPadding === undefined) return 32;
  if (typeof contentPadding === 'number') return contentPadding * 2;
  return (contentPadding.left ?? 0) + (contentPadding.right ?? 0);
}

/** The look of each action: the last one filled, the rest outlined, unless it says otherwise. */
export function actionVariant(action: SheetAction, index: number, count: number): 'filled' | 'outlined' | 'text' {
  return action.variant ?? (index === count - 1 ? 'filled' : 'outlined');
}

/** Whether anything asks for the bar. */
export function hasBar({title, onBack, onClose, menu}: {title?: string; onBack?: () => void; onClose?: () => void; menu?: unknown[]}): boolean {
  return title !== undefined || onBack !== undefined || onClose !== undefined || (menu !== undefined && menu.length > 0);
}

/**
 * How far to blur what is behind the sheet, in pixels, for a platform that
 * takes a length rather than a named material. Chosen against iOS's own
 * materials so a sheet reads about the same on a phone and in a browser.
 */
export const BLUR_RADIUS: Record<Exclude<SheetMaterial, 'none'>, number> = {
  thin: 8,
  regular: 20,
  thick: 40,
};

/**
 * How much of the sheet's own fill is painted over the blur. A thin material
 * is mostly what is behind it; a thick one is mostly the sheet.
 */
export const MATERIAL_OPACITY: Record<Exclude<SheetMaterial, 'none'>, number> = {
  thin: 0.5,
  regular: 0.72,
  thick: 0.88,
};

/** SwiftUI's own name for each of the kit's materials. */
export const IOS_MATERIAL: Record<Exclude<SheetMaterial, 'none'>, 'thin' | 'regular' | 'thick'> = {
  thin: 'thin',
  regular: 'regular',
  thick: 'thick',
};

/** Whether a sheet was asked for a material at all. */
export function hasMaterial(material: SheetMaterial | undefined): material is Exclude<SheetMaterial, 'none'> {
  return material != null && material !== 'none';
}
