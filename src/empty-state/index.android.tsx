import type {EmptyStateProps} from './types';
import {StyleSheet, View} from 'react-native';
import {CircularProgressIndicator, Column, Icon, RNHostView, Text} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, padding, size} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {drawableOf} from '../icons';
import {spacing, useColor} from '../theme';
import {EMPTY_ICON, EmptyStateAction} from './shared';
import {isActionData} from './types';

/**
 * Android has no single control for an empty state, so the column is
 * composed in Compose, in one host: the Material icon in the secondary
 * color, the title in the title scale, the description centred in the
 * secondary color, and the action as the kit's Material button, native
 * beside native rather than a React Native hop between the two. The icon is
 * the token's drawable, as every Compose icon is; while `loading` the
 * `CircularProgressIndicator` takes its place. A node of the app's own as the
 * action is hosted in the column as React Native content.
 */
export function EmptyState({title, description, icon, action, loading = false, testID, style}: EmptyStateProps) {
  const label = useColor('label');
  const muted = useColor('secondaryLabel');
  const tint = useColor('tint');
  const drawable = drawableOf(icon);
  return (
    <View style={[styles.column, style]} testID={testID}>
      <NativeHost>
        <Column horizontalAlignment="center" verticalArrangement={{spacedBy: spacing.two}} modifiers={[fillMaxWidth(), padding(spacing.five, spacing.five, spacing.five, spacing.five)]}>
          {loading ? (
            <CircularProgressIndicator color={tint} modifiers={[size(EMPTY_ICON, EMPTY_ICON)]}/>
          ) : drawable ? (
            <Icon source={drawable} size={EMPTY_ICON} tint={muted}/>
          ) : null}
          <Text color={label} style={{typography: 'titleLarge', textAlign: 'center'}} modifiers={[fillMaxWidth()]}>{title}</Text>
          {description ? (
            <Text color={muted} style={{typography: 'bodyMedium', textAlign: 'center'}} modifiers={[fillMaxWidth()]}>{description}</Text>
          ) : null}
          {action ? (
            isActionData(action)
              ? <EmptyStateAction action={action} testID={testID}/>
              : <RNHostView matchContents><View style={styles.action}>{action}</View></RNHostView>
          ) : null}
        </Column>
      </NativeHost>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    marginTop: spacing.two,
  },
});
