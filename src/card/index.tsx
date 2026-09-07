import type {CardProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Surface} from '../surface';

/** A pressable surface with header, body, footer and overlay slots. */
export function Card({
  children,
  header,
  footer,
  overlay,
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

  if (!overlay) return card;

  return (
    <View style={styles.stack}>
      {card}
      <View
        testID={testID ? `${testID}-overlay` : undefined}
        style={[styles.overlay, {padding}]}>
        {overlay}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
