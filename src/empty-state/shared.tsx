import type {ReactNode} from 'react';
import type {EmptyStateProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Body, Title3} from '../typography';
import {spacing} from '../theme';

/** The icon's size, chosen to sit between the title and the space above it. */
export const EMPTY_ICON = 48;

/**
 * The column every platform lays out the same way, with the icon already drawn
 * by whichever file knows how to draw one here — the kit's `Icon` is web and
 * Windows only, and native platforms use `SymbolView`.
 *
 * One `accessible` group, so a screen reader reads the state as one thing
 * rather than as three unrelated lines of text.
 */
export function EmptyStateLayout({icon, title, description, action, testID, style}: Omit<EmptyStateProps, 'icon'> & {icon?: ReactNode}) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={[styles.column, style]}
      testID={testID}>
      {icon}
      <Title3 align="center" color="label">{title}</Title3>
      {description ? <Body align="center" color="secondaryLabel">{description}</Body> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.two,
    padding: spacing.five,
  },
  action: {
    marginTop: spacing.two,
  },
});
