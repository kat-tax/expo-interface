import type {ListItemProps} from './types';
import {Pressable, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {pressFeedback} from '../surface/shared';
import {Footnote, Label} from '../typography';
import {spacing} from '../theme';

/**
 * Windows draws the row itself, as web does: a leading slot, the headline
 * over its supporting text, a trailing slot and the `action` as the kit's
 * button (a XAML island). The row is a pressable when it has an `onPress`.
 * Its metrics are a WinUI settings card's: 48 points tall at least, 16 of
 * padding at the ends, which a `FieldGroup.Section` supplies instead.
 */
export function ListItem({children, leading, trailing, action, supporting, inset = true, onPress, testID}: ListItemProps) {
  const filled = action?.variant === 'filled';
  const content = (
    <>
      {leading != null ? <View style={styles.slot}>{leading}</View> : null}
      <View style={styles.main}>
        {typeof children === 'string' || typeof children === 'number'
          ? <Label color="label">{children}</Label>
          : children}
        {supporting != null ? (
          typeof supporting === 'string' || typeof supporting === 'number'
            ? <Footnote color="secondaryLabel">{supporting}</Footnote>
            : supporting
        ) : null}
      </View>
      {trailing != null ? <View style={styles.slot}>{trailing}</View> : null}
      {action ? (
        <Button
          label={action.label}
          variant={filled ? 'filled' : 'text'}
          shape={filled ? 'rounded' : undefined}
          size="small"
          role={action.role === 'destructive' ? 'destructive' : 'default'}
          disabled={action.disabled}
          onPress={action.onPress}
        />
      ) : null}
    </>
  );
  const row = [styles.row, inset && styles.inset];
  if (onPress) {
    return (
      <Pressable
        role="button"
        onPress={onPress}
        style={state => [row, pressFeedback(state)]}
        testID={testID}>
        {content}
      </Pressable>
    );
  }
  return <View style={row} testID={testID}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.three,
    minHeight: 48,
    width: '100%',
  },
  inset: {
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    gap: spacing.half,
  },
});

export type {ListItemProps} from './types';
