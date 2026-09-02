import type {ButtonProps, ButtonShape, ButtonVariant} from './types';
import {fillMaxWidth, testID as testIDModifier, width, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {Button as ComposeButton, OutlinedButton, TextButton, Icon, IconButton, FilledIconButton, OutlinedIconButton, Spacer, Shape, Text} from '@expo/ui/jetpack-compose';
import {SIZE_ICON, SIZE_TEXT, androidContentPadding} from './shared';
import {onAccent as contrastOf} from '../accent';
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

function resolveShape(shape?: ButtonShape) {
  if (!shape) return undefined;
  switch (shape) {
    case 'rounded':
      return Shape.RoundedCorner({cornerRadii: {topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12}});
    case 'pill':
      return Shape.Pill({});
    case 'circle':
      return Shape.Circle({});
  }
}

/**
 * Android renders the matching Material 3 button component for each variant.
 * The accent defaults to the theme tint (red for the destructive role) and is
 * applied as the container color (filled) or content color (outlined/text), so
 * the button is branded instead of falling back to the device's Material theme.
 */
export function Button({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  color,
  size = 'medium',
  shape,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  fillWidth = false,
  testID,
}: ButtonProps) {
  const themeTint = useColor('tint');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  const accent = color ?? (role === 'destructive' ? destructive : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const onFilled = variant === 'filled';
  const textColor = onFilled ? onAccent : accent;
  const colors = onFilled
    ? {containerColor: accent, contentColor: onAccent}
    : {contentColor: accent};
  const iconSize = SIZE_ICON[size];
  const textSize = SIZE_TEXT[size];
  const resolvedShape = resolveShape(shape);
  // A `Host` measures a direct child with its own (tight) constraints, which
  // a Compose button would fill on both axes; wrap to the content instead.
  const modifiers = [
    fillWidth ? fillMaxWidth() : wrapContentWidth('start'),
    wrapContentHeight('top'),
  ];
  if (testID) modifiers.push(testIDModifier(testID));
  const iconOnly = hideLabel && !!prefixIcon?.drawable;

  if (iconOnly) {
    const IconComponent = ICON_ONLY_COMPONENT[variant];
    return (
      <IconComponent
        onClick={disabled ? undefined : onPress}
        enabled={!disabled}
        colors={colors}
        shape={resolvedShape}
        modifiers={modifiers}>
        <Icon
          source={prefixIcon!.drawable!}
          size={iconSize}
          tint={textColor}
          contentDescription={label}
        />
      </IconComponent>
    );
  }

  const Component = VARIANT_COMPONENT[variant];
  const pad = androidContentPadding(size, !!(prefixIcon?.drawable || suffixIcon?.drawable));

  return (
    <Component
      onClick={disabled ? undefined : onPress}
      enabled={!disabled}
      colors={colors}
      shape={resolvedShape}
      contentPadding={pad}
      modifiers={modifiers}>
      {prefixIcon?.drawable ? (
        <>
          <Icon source={prefixIcon.drawable} size={iconSize} tint={textColor}/>
          <Spacer modifiers={[width(8)]}/>
        </>
      ) : null}
      <Text color={textColor} style={{fontSize: textSize}}>{label}</Text>
      {suffixIcon?.drawable ? (
        <>
          <Spacer modifiers={[width(8)]}/>
          <Icon source={suffixIcon.drawable} size={iconSize} tint={textColor}/>
        </>
      ) : null}
    </Component>
  );
}
