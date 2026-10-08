import type {ReactNode} from 'react';
import type {EmptyStateProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Body, Title3} from '../typography';
import {spacing} from '../theme';
import {isActionData} from './types';

/** The icon's size, chosen to sit between the title and the space above it. */
export const EMPTY_ICON = 48;

/** What a screen reader reads for the state: the title and the description as one thing. */
export function emptyStateLabel(title: string, description: string | undefined): string {
  return description ? `${title}. ${description}` : title;
}

/** The action as the kit's button where it was given as data, as it is otherwise. */
export function EmptyStateAction({action, testID}: {action: EmptyStateProps['action']; testID?: string}) {
  if (!isActionData(action)) return <>{action}</>;
  return (
    <Button
      testID={testID ? `${testID}-action` : undefined}
      label={action.label}
      variant={action.variant ?? 'filled'}
      prefixIcon={action.icon}
      disabled={action.disabled}
      loading={action.loading}
      onPress={action.onPress}
    />
  );
}

/**
 * The column the web and Windows lay out the same way, with the icon already
 * drawn by whichever file knows how to draw one there: the kit's `Icon` on the
 * web and on Windows, or the spinner while loading.
 *
 * One `accessible` group, so a screen reader reads the state as one thing
 * rather than as three unrelated lines of text.
 */
export function EmptyStateLayout({icon, title, description, action, selectable = true, testID, style}: Omit<EmptyStateProps, 'icon'> & {icon?: ReactNode}) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={emptyStateLabel(title, description)}
      style={[styles.column, style]}
      testID={testID}>
      {icon}
      <Title3 align="center" color="label">{title}</Title3>
      {description ? <Body align="center" color="secondaryLabel" selectable={selectable}>{description}</Body> : null}
      {action ? <View style={styles.action}><EmptyStateAction action={action} testID={testID}/></View> : null}
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
