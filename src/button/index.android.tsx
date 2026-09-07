import type {ButtonProps, ButtonShape, ButtonVariant} from './types';
import {alpha, clickable, fillMaxWidth, testID as testIDModifier, width, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {Button as ComposeButton, OutlinedButton, TextButton, Icon, IconButton, FilledIconButton, OutlinedIconButton, Row, Spacer, Shape, Text} from '@expo/ui/jetpack-compose';
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
      // The native `radius` (a fraction of the shorter side) defaults to 0, so
      // a circle without one is a zero-size outline that clips the content
      // away — an empty button. 1 inscribes the circle in the button's box.
      return Shape.Circle({radius: 1});
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
  tone = 'accent',
  size = 'medium',
  shape,
  iconSize: iconSizeProp,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled,
  fillWidth = false,
  testID,
}: ButtonProps) {
  const themeTint = useColor('tint');
  const themeLabel = useColor('label');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  // The label tone only applies to the text variant: a tool, not a call to action.
  const labelTone = variant === 'text' && tone === 'label' && role !== 'destructive';
  const accent = color ?? (role === 'destructive' ? destructive : labelTone ? themeLabel : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const onFilled = variant === 'filled';
  const textColor = onFilled ? onAccent : accent;
  const colors = onFilled
    ? {containerColor: accent, contentColor: onAccent}
    : {contentColor: accent};
  const iconSize = iconSizeProp ?? SIZE_ICON[size];
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

  // Shared by the Material buttons and the inline row. The label is dropped
  // only when there is an icon to stand in for it (`iconOnly`), so a
  // `hideLabel` without a drawable still reads.
  const content = (
    <>
      {prefixIcon?.drawable ? (
        <>
          <Icon
            source={prefixIcon.drawable}
            size={iconSize}
            tint={textColor}
            contentDescription={iconOnly ? label : undefined}
          />
          {iconOnly ? null : <Spacer modifiers={[width(8)]}/>}
        </>
      ) : null}
      {iconOnly ? null : <Text color={textColor} style={{fontSize: textSize}}>{label}</Text>}
      {suffixIcon?.drawable && !iconOnly ? (
        <>
          <Spacer modifiers={[width(8)]}/>
          <Icon source={suffixIcon.drawable} size={iconSize} tint={textColor}/>
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
          ...(disabled ? [alpha(0.45)] : onPress ? [clickable(onPress)] : []),
        ]}>
        {content}
      </Row>
    );
  }

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
      {content}
    </Component>
  );
}
