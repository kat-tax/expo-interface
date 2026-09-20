import type {Modifier} from './ui-kit';

/**
 * `@expo/ui/jetpack-compose/modifiers` on Windows: every modifier the
 * package exports, building the `{$type, ...params}` record it would. The
 * layout ones (`padding`, `paddingAll`, `size`, `width`, `height`,
 * `fillMax*`, `background`, `border`, `alpha`, `offset`, `zIndex`, `weight`,
 * `clip`) and `clickable` take effect on the views drawn here; the rest are
 * Compose's and are kept without effect.
 */

const NAMED: Record<string, string[]> = {
  paddingAll: ['all'],
  padding: ['start', 'top', 'end', 'bottom'],
  size: ['width', 'height'],
  fillMaxSize: ['fraction'],
  fillMaxWidth: ['fraction'],
  fillMaxHeight: ['fraction'],
  width: ['width'],
  height: ['height'],
  wrapContentWidth: ['alignment'],
  wrapContentHeight: ['alignment'],
  offset: ['x', 'y'],
  background: ['color', 'options'],
  border: ['borderWidth', 'borderColor'],
  shadow: ['elevation'],
  dropShadow: ['shape', 'config'],
  innerShadow: ['shape', 'config'],
  alpha: ['alpha'],
  blur: ['radius'],
  rotate: ['degrees'],
  zIndex: ['index'],
  animateContentSize: ['dampingRatio', 'stiffness'],
  weight: ['weight'],
  align: ['alignment'],
  menuAnchor: ['type', 'enabled'],
  clickable: ['handler', 'options'],
  combinedClickable: ['onClick', 'onLongClick', 'onDoubleClick', 'options'],
  selectable: ['selected', 'onClick', 'options'],
  toggleable: ['value', 'onValueChange', 'options'],
  onVisibilityChanged: ['handler', 'options'],
  onSizeChanged: ['handler'],
  onGloballyPositioned: ['handler'],
  testID: ['testID'],
  clip: ['shape'],
};

function params(type: string, args: unknown[]): Record<string, unknown> {
  const names = NAMED[type];
  if (names) {
    const out: Record<string, unknown> = {};
    names.forEach((name, index) => {
      if (args[index] !== undefined) out[name] = args[index];
    });
    return out;
  }
  const [first] = args;
  if (first && typeof first === 'object' && !Array.isArray(first)) return {...(first as Record<string, unknown>)};
  return first === undefined ? {} : {value: first};
}

export function createModifier(type: string, parameters: Record<string, unknown> = {}): Modifier {
  return {$type: type, ...parameters};
}

export function createModifierWithEventListener(type: string, eventListener: (args: unknown) => void, parameters: Record<string, unknown> = {}): Modifier {
  return {$type: type, ...parameters, eventListener};
}

export function createViewModifierEventListener(modifiers: unknown): Record<string, never> {
  void modifiers;
  return {};
}

type Factory = (...args: unknown[]) => Modifier;

function factory(type: string): Factory {
  return (...args) => createModifier(type, params(type, args));
}

/** The animation specs a modifier can take: kept as records, with no motion on Windows. */
export const animated = (spec?: unknown) => ({type: 'animated', spec});
export const spring = (dampingRatio?: number, stiffness?: number) => ({type: 'spring', dampingRatio, stiffness});
export const tween = (durationMillis?: number, delayMillis?: number, easing?: string) => ({type: 'tween', durationMillis, delayMillis, easing});
export const snap = (delayMillis?: number) => ({type: 'snap', delayMillis});
export const keyframes = (config?: unknown) => ({type: 'keyframes', config});

export const Shapes = {
  Circle: {type: 'circle'},
  Rectangle: {type: 'rectangle'},
  RoundedCorner: (cornerRadius: number) => ({type: 'roundedCorner', cornerRadius}),
  RoundedCornerPercent: (percent: number) => ({type: 'roundedCornerPercent', percent}),
  CutCorner: (size: number) => ({type: 'cutCorner', size}),
  CutCornerPercent: (percent: number) => ({type: 'cutCornerPercent', percent}),
};

export const paddingAll = factory('paddingAll');
export const padding = factory('padding');
export const size = factory('size');
export const fillMaxSize = factory('fillMaxSize');
export const fillMaxWidth = factory('fillMaxWidth');
export const fillMaxHeight = factory('fillMaxHeight');
export const width = factory('width');
export const height = factory('height');
export const defaultMinSize = factory('defaultMinSize');
export const wrapContentWidth = factory('wrapContentWidth');
export const wrapContentHeight = factory('wrapContentHeight');
export const imePadding = factory('imePadding');
export const offset = factory('offset');
export const background = factory('background');
export const border = factory('border');
export const shadow = factory('shadow');
export const dropShadow = factory('dropShadow');
export const innerShadow = factory('innerShadow');
export const alpha = factory('alpha');
export const blur = factory('blur');
export const rotate = factory('rotate');
export const graphicsLayer = factory('graphicsLayer');
export const zIndex = factory('zIndex');
export const animateContentSize = factory('animateContentSize');
export const weight = factory('weight');
export const align = factory('align');
export const matchParentSize = factory('matchParentSize');
export const menuAnchor = factory('menuAnchor');
export const clickable = factory('clickable');
export const combinedClickable = factory('combinedClickable');
export const selectable = factory('selectable');
export const selectableGroup = factory('selectableGroup');
export const toggleable = factory('toggleable');
export const onVisibilityChanged = factory('onVisibilityChanged');
export const onSizeChanged = factory('onSizeChanged');
export const onGloballyPositioned = factory('onGloballyPositioned');
export const testID = factory('testID');
export const semantics = factory('semantics');
export const clip = factory('clip');
export const verticalScroll = factory('verticalScroll');
export const horizontalScroll = factory('horizontalScroll');
