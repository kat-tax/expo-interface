import type {ButtonProps, ButtonShape, ButtonVariant} from './types';
import {alpha, clickable, fillMaxWidth, size as sizeModifier, testID as testIDModifier, toggleable, width, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {Button as ComposeButton, CircularProgressIndicator, OutlinedButton, TextButton, Icon, IconButton, IconToggleButton, FilledIconButton, OutlinedIconButton, Row, Spacer, Shape, Text, ToggleButton} from '@expo/ui/jetpack-compose';
import {SIZE_ICON, SIZE_TEXT, androidContentPadding} from './shared';
import {onAccent as contrastOf} from '../accent';
import {SelfHosted} from '../host';
import {drawableOf} from '../icons';
import {useColor} from '../theme';

const VARIANT_COMPONENT: Record<ButtonVariant, typeof ComposeButton | typeof OutlinedButton | typeof TextButton> = {
  filled: ComposeButton,
  outlined: OutlinedButton,
  text: TextButton,
};

const ICON_ONLY_COMPONENT: Record<ButtonVariant, typeof FilledIconButton | typeof OutlinedIconButton | typeof IconButton> = {
  filled: FilledIconButton,
  outlined: OutlinedIconButton,
  text: IconButton,
};

/** The spinner's stroke, finer than the kit's ring, since it sits in a line of text. */
const SPINNER_STROKE = 2;

const TRANSPARENT = '#00000000';

/** What a press on the inline row is: a toggle's change, which TalkBack hears as on or off, or a click. */
function toggleOrClick(pressed: boolean | undefined, onPress: (() => void) | undefined) {
  if (!onPress) return [];
  return [pressed === undefined ? clickable(onPress) : toggleable(pressed, onPress)];
}

function resolveShape(shape?: ButtonShape) {
  if (!shape) return undefined;
  switch (shape) {
    case 'rounded':
      return Shape.RoundedCorner({cornerRadii: {topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12}});
    case 'pill':
      return Shape.Pill({});
    case 'circle':
      // The native `radius` (a fraction of the shorter side) defaults to 0, so
      // a circle without one is a zero-size outline that clips the content
      // away — an empty button. 1 inscribes the circle in the button's box.
      return Shape.Circle({radius: 1});
  }
}

/**
 * Android renders the matching Material 3 button, in a host of its own where
 * there is none above it, so a button can be placed in a React Native layout
 * like any element.
 */
export function Button(props: ButtonProps) {
  return (
    <SelfHosted fit={!props.fillWidth}>
      <NativeButton {...props}/>
    </SelfHosted>
  );
}

/**
 * The Material 3 button component for each variant. The accent defaults to
 * the theme tint (red for the destructive role) and is applied as the
 * container color (filled) or content color (outlined/text), so the button
 * is branded instead of falling back to the device's Material theme. While
 * `loading` a `CircularProgressIndicator` stands in the icon's place in the
 * content slot, as Material's busy buttons do, and the button is disabled.
 */
function NativeButton({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  color,
  tone = 'accent',
  size = 'medium',
  shape,
  iconSize: iconSizeProp,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  pressed,
  loading = false,
  fillWidth = false,
  testID,
}: ButtonProps) {
  // A toggle that is on is drawn filled, whatever its variant.
  const shown = pressed ? 'filled' : variant;
  const themeTint = useColor('tint');
  const themeLabel = useColor('label');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  // The label tone only applies to the text variant: a tool, not a call to action.
  const labelTone = shown === 'text' && tone === 'label' && role !== 'destructive';
  const accent = color ?? (role === 'destructive' ? destructive : labelTone ? themeLabel : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const onFilled = shown === 'filled';
  const textColor = onFilled ? onAccent : accent;
  // A disabled Material button gives its content Compose's disabled color
  // (onSurface at 38%) through the content color, which a color set on the
  // label or an icon would override; the inline row dims itself with alpha.
  const contentColor = disabled && size !== 'inline' ? undefined : textColor;
  const colors = onFilled
    ? {containerColor: accent, contentColor: onAccent}
    : {contentColor: accent};
  const iconSize = iconSizeProp ?? SIZE_ICON[size];
  const textSize = SIZE_TEXT[size];
  const resolvedShape = resolveShape(shape);
  const inactive = disabled || loading;
  // A `Host` measures a direct child with its own (tight) constraints, which
  // a Compose button would fill on both axes; wrap to the content instead.
  const modifiers = [
    fillWidth ? fillMaxWidth() : wrapContentWidth('start'),
    wrapContentHeight('top'),
  ];
  if (testID) modifiers.push(testIDModifier(testID));
  const prefix = drawableOf(prefixIcon);
  const suffix = drawableOf(suffixIcon);
  const iconOnly = hideLabel && !!prefix;

  // The spinner in the icon's place, in the content's color.
  const spinner = loading ? (
    <CircularProgressIndicator
      color={textColor}
      trackColor="#00000000"
      strokeWidth={SPINNER_STROKE}
      modifiers={[sizeModifier(iconSize, iconSize)]}
    />
  ) : null;
  const leading = spinner ?? (prefix ? (
    <Icon
      source={prefix}
      size={iconSize}
      tint={contentColor}
      contentDescription={iconOnly ? label : undefined}
    />
  ) : null);

  // Shared by the Material buttons and the inline row. The label is dropped
  // only when there is an icon to stand in for it (`iconOnly`), so a
  // `hideLabel` without a drawable still reads.
  const content = (
    <>
      {leading ? (
        <>
          {leading}
          {iconOnly ? null : <Spacer modifiers={[width(8)]}/>}
        </>
      ) : null}
      {iconOnly ? null : <Text color={contentColor} style={{fontSize: textSize}}>{label}</Text>}
      {suffix && !iconOnly ? (
        <>
          <Spacer modifiers={[width(8)]}/>
          <Icon source={suffix} size={iconSize} tint={contentColor}/>
        </>
      ) : null}
    </>
  );

  // The bar size: Material's buttons keep a minimum height, and its icon
  // buttons a 40dp container, that no modifier can shrink — so an inline
  // button is a clickable row of exactly its content instead.
  if (size === 'inline') {
    return (
      <Row
        verticalAlignment="center"
        modifiers={[
          ...modifiers,
          ...(inactive ? [alpha(0.45)] : toggleOrClick(pressed, onPress)),
        ]}>
        {content}
      </Row>
    );
  }

  // A toggle is Material's own: its checked state is in the semantics tree,
  // so TalkBack says whether it is on. Off it takes its variant's colors.
  if (pressed !== undefined) {
    const offContainer = variant === 'filled' ? accent : TRANSPARENT;
    const offContent = variant === 'filled' ? onAccent : accent;
    const toggleColors = {containerColor: offContainer, contentColor: offContent, checkedContainerColor: accent, checkedContentColor: onAccent};
    const Toggle = iconOnly ? IconToggleButton : ToggleButton;
    return (
      <Toggle
        checked={pressed}
        onCheckedChange={() => onPress?.()}
        enabled={!inactive}
        colors={toggleColors}
        modifiers={modifiers}>
        {iconOnly ? leading : content}
      </Toggle>
    );
  }

  if (iconOnly) {
    const IconComponent = ICON_ONLY_COMPONENT[variant];
    return (
      <IconComponent
        onClick={inactive ? undefined : onPress}
        enabled={!inactive}
        colors={colors}
        shape={resolvedShape}
        modifiers={modifiers}>
        {leading}
      </IconComponent>
    );
  }

  const Component = VARIANT_COMPONENT[variant];
  const pad = androidContentPadding(size, !!(leading || suffix));

  return (
    <Component
      onClick={inactive ? undefined : onPress}
      enabled={!inactive}
      colors={colors}
      shape={resolvedShape}
      contentPadding={pad}
      modifiers={modifiers}>
      {content}
    </Component>
  );
}
