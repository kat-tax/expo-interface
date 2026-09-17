import type {Modifier} from './ui-kit';

/**
 * `@expo/ui/swift-ui/modifiers` on Windows: every modifier the package
 * exports, building the same `{$type, ...params}` record it would build,
 * so a view written with them mounts. The layout ones (`frame`, `padding`,
 * `cornerRadius`, `opacity`, `hidden`, `disabled`, `offset`, `zIndex`,
 * `border`, `background`) and the gestures (`onTapGesture`) take effect on
 * the runtime's views; the rest are SwiftUI's and are kept without effect.
 */

/** The parameter names of the modifiers that take their arguments in order rather than as one object. */
const NAMED: Record<string, string[]> = {
  tag: ['tag'],
  cornerRadius: ['radius'],
  opacity: ['value'],
  hidden: ['hidden'],
  disabled: ['disabled'],
  zIndex: ['index'],
  foregroundColor: ['color'],
  tint: ['color'],
  blur: ['radius'],
  brightness: ['amount'],
  contrast: ['amount'],
  saturation: ['amount'],
  hueRotation: ['angle'],
  grayscale: ['amount'],
  colorInvert: ['inverted'],
  scaleEffect: ['scale'],
  rotationEffect: ['angle'],
  buttonStyle: ['style'],
  buttonBorderShape: ['shape'],
  toggleStyle: ['style'],
  pickerStyle: ['style'],
  progressViewStyle: ['style'],
  gaugeStyle: ['style'],
  datePickerStyle: ['style'],
  menuStyle: ['style'],
  menuIndicator: ['visibility'],
  menuOrder: ['order'],
  controlSize: ['size'],
  imageScale: ['scale'],
  labelStyle: ['style'],
  textFieldStyle: ['style'],
  tabViewStyle: ['style'],
  indexViewStyle: ['style'],
  listStyle: ['style'],
  lineLimit: ['count'],
  lineSpacing: ['spacing'],
  kerning: ['value'],
  textCase: ['textCase'],
  truncationMode: ['mode'],
  minimumScaleFactor: ['factor'],
  multilineTextAlignment: ['alignment'],
  listSectionSpacing: ['spacing'],
  listRowSpacing: ['spacing'],
  listRowBackground: ['color'],
  listRowSeparator: ['visibility'],
  listRowSeparatorTint: ['color'],
  background: ['color'],
  containerBackground: ['color'],
  scrollContentBackground: ['visibility'],
  aspectRatio: ['ratio'],
  layoutPriority: ['priority'],
  id: ['id'],
  environment: ['key', 'value'],
  accessibilityLabel: ['label'],
  accessibilityHint: ['hint'],
  accessibilityValue: ['value'],
  accessibilityIdentifier: ['identifier'],
  accessibilityHidden: ['hidden'],
  accessibilityElement: ['options'],
  accessibilityAddTraits: ['traits'],
  accessibilityRemoveTraits: ['traits'],
  accessibilityInputLabels: ['labels'],
  onLongPressGesture: ['eventListener', 'minimumDuration'],
  onTapGesture: ['eventListener'],
  onAppear: ['eventListener'],
  onDisappear: ['eventListener'],
  onGeometryChange: ['eventListener'],
  onScrollPhaseChange: ['eventListener'],
  useScrollGeometryChange: ['eventListener'],
  onSubmit: ['eventListener'],
  refreshable: ['eventListener'],
  submitLabel: ['label'],
  keyboardType: ['type'],
  autocorrectionDisabled: ['disabled'],
  textInputAutocapitalization: ['mode'],
  textContentType: ['type'],
  contentTransition: ['transition'],
  symbolEffect: ['effect', 'options'],
  animation: ['animation', 'value'],
  headerProminence: ['prominence'],
  badgeProminence: ['prominence'],
  badge: ['value'],
  underline: ['active', 'options'],
  strikethrough: ['active', 'options'],
  allowsTightening: ['flag'],
  textSelection: ['enabled'],
  lineHeight: ['height'],
  font: ['font'],
  dynamicTypeSize: ['size'],
  gridCellColumns: ['count'],
  gridColumnAlignment: ['alignment'],
  gridCellAnchor: ['anchor'],
  gridCellUnsizedAxes: ['axes'],
  glassEffect: ['options'],
  glassEffectId: ['id', 'namespace'],
  presentationDetents: ['detents'],
  presentationDragIndicator: ['visibility'],
  presentationBackground: ['color'],
  presentationBackgroundInteraction: ['interaction'],
  presentationSizing: ['sizing'],
  interactiveDismissDisabled: ['disabled'],
  scrollPosition: ['position'],
  scrollDisabled: ['disabled'],
  scrollIndicators: ['visibility'],
  scrollDismissesKeyboard: ['mode'],
  scrollTargetBehavior: ['behavior'],
  defaultScrollAnchor: ['anchor'],
  defaultScrollAnchorForRole: ['anchor', 'role'],
  moveDisabled: ['disabled'],
  deleteDisabled: ['disabled'],
  menuActionDismissBehavior: ['behavior'],
  luminanceToAlpha: [],
  resizable: [],
  clipped: [],
  redacted: ['reason'],
  privacySensitive: ['sensitive'],
  invalidatableContent: ['invalidatable'],
  widgetURL: ['url'],
  widgetAccentedRenderingMode: ['mode'],
  activityBackgroundTint: ['color'],
  mask: ['shape'],
  overlay: ['content'],
  alignmentGuide: ['guide', 'computeValue'],
  matchedGeometryEffect: ['id', 'namespace', 'options'],
  blurEffect: ['style'],
  containerShape: ['shape'],
  contentShape: ['shape'],
  clipShape: ['shape'],
};

/** Modifiers that default to on when called with nothing. */
const DEFAULT_TRUE = new Set(['hidden', 'disabled', 'colorInvert', 'redacted', 'privacySensitive', 'invalidatableContent', 'accessibilityHidden', 'autocorrectionDisabled', 'scrollDisabled', 'interactiveDismissDisabled', 'moveDisabled', 'deleteDisabled', 'underline', 'strikethrough']);

function params(type: string, args: unknown[]): Record<string, unknown> {
  const names = NAMED[type];
  if (names) {
    const out: Record<string, unknown> = {};
    names.forEach((name, index) => {
      if (args[index] !== undefined) out[name] = args[index];
    });
    if (DEFAULT_TRUE.has(type) && args[0] === undefined && names.length) out[names[0]] = true;
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

/** The listeners a view's modifiers carry, by the event each answers — the runtime's views read the tap gesture themselves. */
export function createViewModifierEventListener(modifiers: unknown): Record<string, never> {
  void modifiers;
  return {};
}

export function isModifier(value: unknown): value is Modifier {
  return !!value && typeof value === 'object' && typeof (value as Modifier).$type === 'string';
}

export function filterModifiers(modifiers: unknown[] | undefined, types: string[]): Modifier[] {
  return (modifiers ?? []).filter(isModifier).filter(entry => types.includes(entry.$type));
}

type Factory = (...args: unknown[]) => Modifier;

function factory(type: string): Factory {
  return (...args) => createModifier(type, params(type, args));
}

export const Animation = {
  default: () => ({type: 'default'}),
  easeIn: (duration?: number) => ({type: 'easeIn', duration}),
  easeOut: (duration?: number) => ({type: 'easeOut', duration}),
  easeInOut: (duration?: number) => ({type: 'easeInOut', duration}),
  linear: (duration?: number) => ({type: 'linear', duration}),
  spring: (options?: object) => ({type: 'spring', ...options}),
  bouncy: (options?: object) => ({type: 'bouncy', ...options}),
  smooth: (options?: object) => ({type: 'smooth', ...options}),
  snappy: (options?: object) => ({type: 'snappy', ...options}),
  interactiveSpring: (options?: object) => ({type: 'interactiveSpring', ...options}),
  interpolatingSpring: (options?: object) => ({type: 'interpolatingSpring', ...options}),
};

export const shapes = {
  rectangle: () => ({type: 'rectangle'}),
  roundedRectangle: (cornerRadius: number, style?: string) => ({type: 'roundedRectangle', cornerRadius, style}),
  circle: () => ({type: 'circle'}),
  capsule: (style?: string) => ({type: 'capsule', style}),
  ellipse: () => ({type: 'ellipse'}),
  unevenRoundedRectangle: (options: object) => ({type: 'unevenRoundedRectangle', ...options}),
  concentricRectangle: (options?: object) => ({type: 'concentricRectangle', ...options}),
};

export const blurEffect = factory('blurEffect');
export const animation = factory('animation');
export const containerBackground = factory('containerBackground');
export const containerShape = factory('containerShape');
export const contentShape = factory('contentShape');
export const background = factory('background');
export const tag = factory('tag');
export const pickerStyle = factory('pickerStyle');
export const menuOrder = factory('menuOrder');
export const tabViewStyle = factory('tabViewStyle');
export const indexViewStyle = factory('indexViewStyle');
export const datePickerStyle = factory('datePickerStyle');
export const progressViewStyle = factory('progressViewStyle');
export const gaugeStyle = factory('gaugeStyle');
export const presentationDetents = factory('presentationDetents');
export const presentationDragIndicator = factory('presentationDragIndicator');
export const presentationBackgroundInteraction = factory('presentationBackgroundInteraction');
export const presentationBackground = factory('presentationBackground');
export const interactiveDismissDisabled = factory('interactiveDismissDisabled');
export const presentationSizing = factory('presentationSizing');
export const environment = factory('environment');
export const id = factory('id');
export const scrollPosition = factory('scrollPosition');
export const symbolEffect = factory('symbolEffect');
export const useScrollGeometryChange = factory('useScrollGeometryChange');
export const onScrollPhaseChange = factory('onScrollPhaseChange');
export const widgetAccentedRenderingMode = factory('widgetAccentedRenderingMode');
export const widgetURL = factory('widgetURL');
export const activityBackgroundTint = factory('activityBackgroundTint');
export const listSectionSpacing = factory('listSectionSpacing');
export const cornerRadius = factory('cornerRadius');
export const shadow = factory('shadow');
export const matchedGeometryEffect = factory('matchedGeometryEffect');
export const geometryGroup = factory('geometryGroup');
export const frame = factory('frame');
export const containerRelativeFrame = factory('containerRelativeFrame');
export const padding = factory('padding');
export const fixedSize = factory('fixedSize');
export const ignoreSafeArea = factory('ignoreSafeArea');
export const onTapGesture = factory('onTapGesture');
export const onLongPressGesture = factory('onLongPressGesture');
export const onAppear = factory('onAppear');
export const onDisappear = factory('onDisappear');
export const onGeometryChange = factory('onGeometryChange');
export const refreshable = factory('refreshable');
export const opacity = factory('opacity');
export const clipShape = factory('clipShape');
export const border = factory('border');
export const strokeBorder = factory('strokeBorder');
export const scaleEffect = factory('scaleEffect');
export const rotationEffect = factory('rotationEffect');
export const rotation3DEffect = factory('rotation3DEffect');
export const offset = factory('offset');
export const foregroundColor = factory('foregroundColor');
export const foregroundStyle = factory('foregroundStyle');
export const bold = factory('bold');
export const italic = factory('italic');
export const monospacedDigit = factory('monospacedDigit');
export const tint = factory('tint');
export const hidden = factory('hidden');
export const disabled = factory('disabled');
export const redacted = factory('redacted');
export const unredacted = factory('unredacted');
export const privacySensitive = factory('privacySensitive');
export const invalidatableContent = factory('invalidatableContent');
export const zIndex = factory('zIndex');
export const blur = factory('blur');
export const brightness = factory('brightness');
export const contrast = factory('contrast');
export const saturation = factory('saturation');
export const hueRotation = factory('hueRotation');
export const colorInvert = factory('colorInvert');
export const grayscale = factory('grayscale');
export const buttonStyle = factory('buttonStyle');
export const buttonBorderShape = factory('buttonBorderShape');
export const toggleStyle = factory('toggleStyle');
export const menuStyle = factory('menuStyle');
export const menuIndicator = factory('menuIndicator');
export const controlSize = factory('controlSize');
export const imageScale = factory('imageScale');
export const labelStyle = factory('labelStyle');
export const labelsHidden = factory('labelsHidden');
export const textFieldStyle = factory('textFieldStyle');
export const scrollDismissesKeyboard = factory('scrollDismissesKeyboard');
export const scrollDisabled = factory('scrollDisabled');
export const scrollIndicators = factory('scrollIndicators');
export const defaultScrollAnchor = factory('defaultScrollAnchor');
export const defaultScrollAnchorForRole = factory('defaultScrollAnchorForRole');
export const scrollTargetBehavior = factory('scrollTargetBehavior');
export const scrollTargetLayout = factory('scrollTargetLayout');
export const moveDisabled = factory('moveDisabled');
export const deleteDisabled = factory('deleteDisabled');
export const menuActionDismissBehavior = factory('menuActionDismissBehavior');
export const accessibilityLabel = factory('accessibilityLabel');
export const accessibilityHint = factory('accessibilityHint');
export const accessibilityValue = factory('accessibilityValue');
export const accessibilityInputLabels = factory('accessibilityInputLabels');
export const accessibilityIdentifier = factory('accessibilityIdentifier');
export const accessibilityHidden = factory('accessibilityHidden');
export const accessibilityElement = factory('accessibilityElement');
export const accessibilityAddTraits = factory('accessibilityAddTraits');
export const accessibilityRemoveTraits = factory('accessibilityRemoveTraits');
export const layoutPriority = factory('layoutPriority');
export const mask = factory('mask');
export const overlay = factory('overlay');
export const backgroundOverlay = factory('backgroundOverlay');
export const aspectRatio = factory('aspectRatio');
export const clipped = factory('clipped');
export const glassEffect = factory('glassEffect');
export const glassEffectId = factory('glassEffectId');
export const scrollContentBackground = factory('scrollContentBackground');
export const listRowBackground = factory('listRowBackground');
export const listRowSeparator = factory('listRowSeparator');
export const listRowSeparatorTint = factory('listRowSeparatorTint');
export const listRowSpacing = factory('listRowSpacing');
export const alignmentGuide = factory('alignmentGuide');
export const truncationMode = factory('truncationMode');
export const allowsTightening = factory('allowsTightening');
export const minimumScaleFactor = factory('minimumScaleFactor');
export const kerning = factory('kerning');
export const textCase = factory('textCase');
export const underline = factory('underline');
export const strikethrough = factory('strikethrough');
export const multilineTextAlignment = factory('multilineTextAlignment');
export const textSelection = factory('textSelection');
export const lineSpacing = factory('lineSpacing');
export const lineHeight = factory('lineHeight');
export const lineLimit = factory('lineLimit');
export const headerProminence = factory('headerProminence');
export const listRowInsets = factory('listRowInsets');
export const badgeProminence = factory('badgeProminence');
export const badge = factory('badge');
export const listSectionMargins = factory('listSectionMargins');
export const font = factory('font');
export const dynamicTypeSize = factory('dynamicTypeSize');
export const gridCellUnsizedAxes = factory('gridCellUnsizedAxes');
export const gridCellColumns = factory('gridCellColumns');
export const gridColumnAlignment = factory('gridColumnAlignment');
export const gridCellAnchor = factory('gridCellAnchor');
export const submitLabel = factory('submitLabel');
export const keyboardType = factory('keyboardType');
export const autocorrectionDisabled = factory('autocorrectionDisabled');
export const onSubmit = factory('onSubmit');
export const textInputAutocapitalization = factory('textInputAutocapitalization');
export const textContentType = factory('textContentType');
export const contentTransition = factory('contentTransition');
export const listStyle = factory('listStyle');
export const luminanceToAlpha = factory('luminanceToAlpha');
export const resizable = factory('resizable');
