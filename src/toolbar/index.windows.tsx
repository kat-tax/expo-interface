import type {ReactNode} from 'react';
import type {ToolbarProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlCommandBar from '../windows/specs/ExpoInterfaceCommandBarNativeComponent';
import {glyphOf, jsonProp, useXamlProps} from '../windows';
import {Surface} from '../surface';
import {spacing} from '../theme';
import {hasCommands} from './shared';

const DENSITY = {
  regular: {gap: spacing.two, edge: spacing.three},
  compact: {gap: spacing.half, edge: spacing.two},
} as const;

/** The height a `CommandBar` asks for with its labels under the icons. */
const BAR_HEIGHT = 68;

/**
 * Windows has two toolbars, and which one this is depends on how the bar was
 * described.
 *
 * Commands given as data become a real WinUI `CommandBar`: the platform lays
 * them out, works out which of them fit the width, moves the rest into an
 * overflow menu it draws itself, and handles the labels and the keyboard.
 * None of that is possible for a bar handed React children, which is the same
 * split `Popover` makes between its `TeachingTip` and its drawn card.
 *
 * A `field` sends the bar back to the drawn path even with commands, because a
 * text field is a React Native input and cannot live inside the island.
 */
export function Toolbar(props: ToolbarProps) {
  if (hasCommands(props.commands) && props.field == null) return <NativeToolbar {...props}/>;
  return <DrawnToolbar {...props}/>;
}

function NativeToolbar({commands = [], placement = 'bottom', density = 'regular', children, style, testID}: ToolbarProps) {
  const xaml = useXamlProps();
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      style={[styles.nativeBar, style]}
      testID={testID}>
      <XamlCommandBar
        commands={jsonProp(commands.map(command => ({
          label: command.label,
          glyph: glyphOf(command.icon),
          secondary: command.secondary ?? false,
          disabled: command.disabled ?? false,
          role: command.role ?? 'default',
          separator: command.separator ?? false,
        })))}
        // Beside the icon, not under it: a CommandBar only shows labels it has
        // placed underneath once the bar is open, so 'bottom' on a closed bar
        // is a row of unlabelled glyphs. A dense bar drops them altogether and
        // leaves the naming to the overflow menu, which is what Fluent does
        // with a row of icon tools.
        labels={density === 'compact' ? 'collapsed' : 'right'}
        onPress={event => commands[event.nativeEvent.index]?.onPress?.()}
        style={styles.commandBar}
        {...xaml}
      />
      {children}
    </Surface>
  );
}

/**
 * The bar the kit draws: the same `Surface`, with its controls as React Native
 * rows — every kit control is a XAML island of its own here, so there is no
 * single native row to gather them in, and a `field` needs no host either side.
 */
function DrawnToolbar({leading, trailing, field, placement = 'bottom', density = 'regular', children, style, testID}: ToolbarProps) {
  const {gap, edge} = DENSITY[density];
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      style={[styles.bar, {paddingHorizontal: edge}, style]}
      testID={testID}>
      <View style={[styles.row, {gap}]}>
        <Group gap={gap}>{leading}</Group>
        {field != null ? <View style={styles.field}>{field}</View> : <View style={styles.spacer}/>}
        <Group gap={gap}>{trailing}</Group>
      </View>
      {children}
    </Surface>
  );
}

function Group({gap, children}: {gap: number; children?: ReactNode}) {
  if (!children) return null;
  return <View style={[styles.group, {gap}]}>{children}</View>;
}

const styles = StyleSheet.create({
  nativeBar: {
    width: '100%',
    gap: spacing.two,
  },
  commandBar: {
    width: '100%',
    height: BAR_HEIGHT,
  },
  bar: {
    width: '100%',
    paddingVertical: spacing.two,
    gap: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
