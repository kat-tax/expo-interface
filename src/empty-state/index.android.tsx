import type {EmptyStateProps} from './types';
import {StyleSheet, View} from 'react-native';
import {CircularProgressIndicator, Column, Icon, RNHostView, Text} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, padding, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, NativeHostContext, useNativeHost} from '../host';
import {drawableOf} from '../icons';
import {spacing, useColor} from '../theme';
import {EMPTY_ICON, EmptyStateAction} from './shared';
import {isActionData} from './types';

/**
 * Android has no single control for an empty state, so the column is
 * composed in Compose: the Material icon in the secondary color, the title in
 * the title scale, the description centred in the secondary color, and the
 * action as the kit's Material button, native beside native rather than a
 * React Native hop between the two. The icon is the token's drawable, as
 * every Compose icon is; while `loading` the `CircularProgressIndicator`
 * takes its place. A node of the app's own as the action is hosted in the
 * column as React Native content.
 *
 * Outside a host the column mounts one of its own, as wide as its container.
 * Inside one (a `Screen native`, a `Sheet`, a hosted `List`'s `empty`) it
 * renders bare, as every self-hosting control does: as wide as its container
 * and as tall as itself, placed by that container.
 */
export function EmptyState(props: EmptyStateProps) {
  const hosted = useNativeHost();
  const column = <EmptyStateColumn {...props} hosted={hosted}/>;
  if (hosted) return column;
  return (
    <View style={[styles.column, props.style]} testID={props.testID}>
      <NativeHost>{column}</NativeHost>
    </View>
  );
}

/** The state as one Compose column, with the test ID on it when there is no view around it. */
function EmptyStateColumn({title, description, icon, action, loading = false, testID, hosted}: EmptyStateProps & {hosted: boolean}) {
  const label = useColor('label');
  const muted = useColor('secondaryLabel');
  const tint = useColor('tint');
  const drawable = drawableOf(icon);
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{spacedBy: spacing.two}}
      modifiers={[fillMaxWidth(), padding(spacing.five, spacing.five, spacing.five, spacing.five), ...(hosted && testID ? [testIDModifier(testID)] : [])]}>
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
        isActionData(action) ? (
          <EmptyStateAction action={action} testID={testID}/>
        ) : (
          // The column's spacing separates it, so no margin: the hosted
          // view's size is its frame, which a margin would fall outside of.
          <RNHostView matchContents>
            {/* React Native again, so the kit's controls in the node mount hosts of their own. */}
            <NativeHostContext.Provider value={false}>
              <View>{action}</View>
            </NativeHostContext.Provider>
          </RNHostView>
        )
      ) : null}
    </Column>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
