import type {ViewStyle} from 'react-native';
import type {SurfaceColor, SurfaceProps} from './types';
import type {ColorTokens} from '../theme';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import {useColor} from '../theme';
import {pressFeedback} from './shared';

const FILL: Record<Exclude<SurfaceColor, 'none'>, ColorTokens> = {
  background: 'background',
  element: 'backgroundElement',
  selected: 'backgroundSelected',
};

const SHADOW = '0 8px 24px rgba(0, 0, 0, 0.18)';

/**
 * react-native-web renders a pressable with a button role as a real
 * `<button>`, whose user-agent style centres everything inside it and leaves
 * the arrow cursor. A surface is a box, not a label: undo both.
 */
const WEB_BUTTON = Platform.OS === 'web'
  ? ({textAlign: 'start', cursor: 'pointer'} as unknown as ViewStyle)
  : null;

/**
 * A box in the theme's colors, drawn in React Native on every platform (see
 * {@link SurfaceProps}). Pressable with `onPress`, in which case `label`
 * names it for assistive technology.
 */
export function Surface({
  children,
  color = 'element',
  border = 'none',
  dashed = false,
  borderColor,
  radius = 12,
  raised = false,
  padding,
  onPress,
  onLongPress,
  disabled = false,
  label,
  onLayout,
  style,
  testID,
}: SurfaceProps) {
  const fill = useColor(color === 'none' ? 'background' : FILL[color]);
  const separator = useColor('separator');
  const line = borderColor ?? separator;
  const width = border === 'none' ? undefined : StyleSheet.hairlineWidth;
  const box: ViewStyle = {
    backgroundColor: color === 'none' ? undefined : fill,
    borderRadius: radius === 'pill' ? 999 : radius,
    borderColor: line,
    borderStyle: dashed ? 'dashed' : undefined,
    borderTopWidth: border === 'all' || border === 'top' ? width : undefined,
    borderBottomWidth: border === 'all' || border === 'bottom' ? width : undefined,
    borderLeftWidth: border === 'all' ? width : undefined,
    borderRightWidth: border === 'all' ? width : undefined,
    boxShadow: raised ? SHADOW : undefined,
    padding,
    opacity: disabled ? 0.5 : undefined,
  };

  if (!onPress && !onLongPress) {
    return <View style={[box, style]} onLayout={onLayout} testID={testID}>{children}</View>;
  }

  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      style={state => [box, WEB_BUTTON, pressFeedback(state), style]}
      testID={testID}>
      {children}
    </Pressable>
  );
}
