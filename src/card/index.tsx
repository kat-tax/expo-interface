import type {CardProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Surface} from '../surface';

/** A pressable surface with header, body, footer and two floating slots. */
export function Card({
  children,
  header,
  footer,
  overlay,
  badge,
  onPress,
  onLongPress,
  label,
  padding = 12,
  gap = 8,
  disabled = false,
  style,
  testID,
}: CardProps) {
  const card = (
    <Surface
      border="all"
      padding={padding}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      label={label}
      style={[{gap}, style]}
      testID={testID}>
      {header}
      {children}
      {footer}
    </Surface>
  );

  if (!overlay && !badge) return card;

  // Both slots are siblings of the card rather than children of it: what they
  // hold is a button, and a button cannot be nested in the card's own.
  return (
    <View style={styles.stack}>
      {card}
      {badge ? (
        <View
          testID={testID ? `${testID}-badge` : undefined}
          style={[styles.float, styles.badge, {padding}]}>
          {badge}
        </View>
      ) : null}
      {overlay ? (
        <View
          testID={testID ? `${testID}-overlay` : undefined}
          style={[styles.float, styles.overlay, {padding}]}>
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'relative',
  },
  // What the two floating slots share: the card's trailing edge, taking no
  // presses of their own so the card behind keeps the rest of its face.
  float: {
    position: 'absolute',
    right: 0,
    pointerEvents: 'box-none',
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlay: {bottom: 0},
  badge: {top: 0},
});
