import type {EmptyStateProps} from './types';
import {useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {Box, CircularProgressIndicator, Column, Icon, RNHostView, Text} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, onSizeChanged, padding, size, testID as testIDModifier, wrapContentHeight} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, NativeHostContext, useNativeHost} from '../host';
import {drawableOf} from '../icons';
import {spacing, useColor} from '../theme';
import {Subheadline} from '../typography';
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
 * column as React Native content, and so is the description while it is
 * `selectable`, since Compose text here cannot be selected.
 *
 * Outside a host the column mounts one of its own, as wide as its container.
 * Inside one (a `Screen native`, a `Sheet`'s native content, a hosted
 * `List`'s `empty`) it renders bare, as every self-hosting control does: as
 * wide as its container and centred in the height the container hands down,
 * the whole screen under a `Screen native`, as iOS centres it. Where the
 * container leaves the height open it is as tall as itself, placed by that
 * container.
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
function EmptyStateColumn({title, description, icon, action, loading = false, selectable = true, testID, hosted}: EmptyStateProps & {hosted: boolean}) {
  const label = useColor('label');
  const muted = useColor('secondaryLabel');
  const tint = useColor('tint');
  const drawable = drawableOf(icon);
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{spacedBy: spacing.two}}
      // Centred in the height a host hands down: a `Screen native`'s host is
      // the screen's size and lays every child out from its top, so without
      // it the state sits under the app bar where iOS centres it. Where the
      // height is left to the state (its own host, a sheet's column, a list's
      // centring box) the column keeps its own height.
      modifiers={[fillMaxWidth(), wrapContentHeight('centerVertically'), padding(spacing.five, spacing.five, spacing.five, spacing.five), ...(hosted && testID ? [testIDModifier(testID)] : [])]}>
      {loading ? (
        <CircularProgressIndicator color={tint} modifiers={[size(EMPTY_ICON, EMPTY_ICON)]}/>
      ) : drawable ? (
        <Icon source={drawable} size={EMPTY_ICON} tint={muted}/>
      ) : null}
      <Text color={label} style={{typography: 'titleLarge', textAlign: 'center'}} modifiers={[fillMaxWidth()]}>{title}</Text>
      {description ? (
        selectable ? (
          <SelectableDescription>{description}</SelectableDescription>
        ) : (
          <Text color={muted} style={{typography: 'bodyMedium', textAlign: 'center'}} modifiers={[fillMaxWidth()]}>{description}</Text>
        )
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

/**
 * The description as React Native text, which Android can select: `@expo/ui`'s
 * Compose layer has no `SelectionContainer`. Hosted text has no width of its
 * own to wrap at, so it is told the column's, as Compose measures it; until
 * then, the window's less the column's padding. The box fills the column's
 * width whatever the text, so the measure does not feed back into itself.
 */
function SelectableDescription({children}: {children: string}) {
  const {width: windowWidth} = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth - spacing.five * 2);
  return (
    <Box contentAlignment="topCenter" modifiers={[fillMaxWidth(), onSizeChanged(next => setWidth(next.width))]}>
      <RNHostView matchContents>
        <Subheadline align="center" color="secondaryLabel" selectable style={[styles.description, {width}]}>{children}</Subheadline>
      </RNHostView>
    </Box>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * The kit's Android subheadline is Material's `bodyMedium` (14 on 20), the
   * style of the Compose text it stands in for; Material tracks it at 0.25.
   */
  description: {
    letterSpacing: 0.25,
  },
});
