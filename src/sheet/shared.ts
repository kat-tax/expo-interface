import type {ReactNode} from 'react';
import type {BottomSheetContentPadding, BottomSheetProps} from '@expo/ui';
import type {MenuItem} from '../menu/types';
import type {SheetAction, SheetMaxHeight} from './types';

// The material facts are the material module's; the sheet's callers read them here too.
export {BLUR_RADIUS, IOS_MATERIAL, MATERIAL_OPACITY, hasMaterial} from '../material/shared';

/** A fraction kept between 0 and 1; one that is not a number counts as 0. */
export function capFraction(fraction: number): number {
  return Number.isNaN(fraction) ? 0 : Math.min(Math.max(fraction, 0), 1);
}

/** The body's cap in points: `maxHeight` as given, or its fraction of `height`. */
export function bodyCap(maxHeight: SheetMaxHeight | undefined, height: number): number | undefined {
  return typeof maxHeight === 'object' ? capFraction(maxHeight.fraction) * height : maxHeight;
}

/** What the bar draws. */
export interface SheetBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  menu?: MenuItem[];
  testID?: string;
}

/** What a piece of React Native content hosted in the sheet takes. */
export interface SheetHostedProps {
  /** The sheet's own padding, which the box's width leaves out. */
  contentPadding?: BottomSheetContentPadding;
  /** The box's test identifier, on iOS and Android. */
  testID?: string;
  children?: ReactNode;
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

/** The inset the platforms keep at each side of the sheet's content when `contentPadding` is left out. */
export const SIDE_INSET = 16;

/** The sheet's padding on each edge, in points. */
export interface ContentPaddingEdges {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * The sheet's padding on each edge: `fallback` when none is given, a number
 * on every edge, and what an object says, with 0 for an edge it leaves out.
 */
export function contentPaddingEdges(contentPadding: BottomSheetContentPadding | undefined, fallback: ContentPaddingEdges): ContentPaddingEdges {
  if (contentPadding === undefined) return fallback;
  if (typeof contentPadding === 'number') return {top: contentPadding, bottom: contentPadding, left: contentPadding, right: contentPadding};
  return {top: contentPadding.top ?? 0, bottom: contentPadding.bottom ?? 0, left: contentPadding.left ?? 0, right: contentPadding.right ?? 0};
}

/**
 * What the sheet's own padding takes from a body's width on both sides: the
 * platforms' default inset of 16 a side, or what `contentPadding` says.
 */
export function horizontalInset(contentPadding: BottomSheetContentPadding | undefined): number {
  const {left, right} = contentPaddingEdges(contentPadding, {top: 0, bottom: 0, left: SIDE_INSET, right: SIDE_INSET});
  return left + right;
}

/**
 * Android: whether the sheet skips Material's partially expanded state, the
 * stop half way up the window where a sheet taller than that opens. A sheet
 * without `snapPoints` fits its content, so it skips the stop and opens
 * whole; with them it keeps the stop for a snap point that asks for one: a
 * `half`, a fraction under 1 or a height.
 */
export function skipsPartiallyExpanded(snapPoints: BottomSheetProps['snapPoints']): boolean {
  if (snapPoints === undefined || snapPoints.length === 0) return true;
  return !snapPoints.some(point => point === 'half' || (typeof point === 'object' && 'fraction' in point && point.fraction < 1) || (typeof point === 'object' && 'height' in point));
}

/**
 * Android: whether the sheet's content fills the window's height, which a
 * `full` snap point or a fraction of 1 or more asks for. Material sizes the
 * sheet to its content otherwise.
 */
export function fillsMaxHeight(snapPoints: BottomSheetProps['snapPoints']): boolean {
  return snapPoints !== undefined && snapPoints.some(point => point === 'full' || (typeof point === 'object' && 'fraction' in point && point.fraction >= 1));
}

/** The look of each action: the last one filled, the rest outlined, unless it says otherwise. */
export function actionVariant(action: SheetAction, index: number, count: number): 'filled' | 'outlined' | 'text' {
  return action.variant ?? (index === count - 1 ? 'filled' : 'outlined');
}

/**
 * Whether React draws anything for a node: not for `null`, `undefined`, a
 * boolean or an empty string, so `footer={canReply && <Composer/>}` hosts no
 * empty box.
 */
export function drawsSomething(node: ReactNode): boolean {
  return node != null && typeof node !== 'boolean' && node !== '';
}

/** Whether anything asks for the bar. */
export function hasBar({title, onBack, onClose, menu}: {title?: string; onBack?: () => void; onClose?: () => void; menu?: unknown[]}): boolean {
  return title !== undefined || onBack !== undefined || onClose !== undefined || (menu !== undefined && menu.length > 0);
}
