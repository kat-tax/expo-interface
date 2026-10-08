import type {ReactNode} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import type {ToolbarCommand, ToolbarProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlCommandBar from '../windows/specs/ExpoInterfaceCommandBarNativeComponent';
import {glyphOf, jsonProp, useXamlProps} from '../windows';
import {Surface} from '../surface';
import {useAnchored} from '../anchored';
import {Button} from '../button';
import {Menu} from '../menu';
import {isCompact} from '../size-class';
import {spacing} from '../theme';
import {MORE} from '../glyphs';
import {anchoredStyles, hasCommands, splitCommands} from './shared';

const DENSITY = {
  regular: {gap: spacing.two, edge: spacing.three},
  compact: {gap: spacing.half, edge: spacing.two},
} as const;

/** The height a `CommandBar` asks for with its labels under the icons. */
const BAR_HEIGHT = 68;

/** The height of a `CommandBar` with no labels: a floating bar's. */
const COMPACT_HEIGHT = 48;

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
  if (props.at !== undefined) return <AnchoredToolbar {...props}/>;
  return <PlacedToolbar {...props}/>;
}

/** A bar where it is laid out: the platform's `CommandBar` for commands, the kit's otherwise. */
function PlacedToolbar(props: ToolbarProps) {
  if (hasCommands(props.commands) && props.field == null) return <NativeToolbar {...props}/>;
  return <DrawnToolbar {...props}/>;
}

/**
 * A floating bar beside a rectangle, laid over its parent: centred on the
 * rectangle, over it unless there is no room, inside the parent less its
 * insets, and drawn only once it has been measured and placed.
 */
function AnchoredToolbar(props: ToolbarProps) {
  const {at = null, preferredEdge = 'top', insets, testID} = props;
  const anchored = useAnchored({at, preferredEdge, insets, align: 'center'});
  return (
    <View style={anchoredStyles.bounds} onLayout={anchored.onBounds} testID={testID ? `${testID}-bounds` : undefined}>
      {at ? (
        <View
          onLayout={anchored.onCard}
          style={[anchoredStyles.bar, {left: anchored.left, top: anchored.top}, anchored.placed ? null : anchoredStyles.unplaced]}>
          <PlacedToolbar {...props} floating/>
        </View>
      ) : null}
    </View>
  );
}

/** The surface a bar sits on: along an edge with a hairline on its content side, or raised and rounded, floating. */
function barSurface(floating: boolean, placement: 'top' | 'bottom') {
  return floating
    ? {color: 'element' as const, radius: 12, border: 'all' as const, raised: true}
    : {color: 'background' as const, radius: 0, border: placement === 'bottom' ? 'top' as const : 'bottom' as const, raised: false};
}

function NativeToolbar({commands = [], placement = 'bottom', density = 'regular', floating = false, children, style, testID}: ToolbarProps) {
  const xaml = useXamlProps();
  return (
    <Surface
      {...barSurface(floating, placement)}
      style={[floating ? styles.floatingBar : styles.nativeBar, style]}
      testID={testID}>
      <XamlCommandBar
        commands={jsonProp(commands.map(command => ({
          label: command.label,
          glyph: glyphOf(command.icon),
          secondary: command.secondary ?? false,
          disabled: command.disabled ?? false,
          role: command.role ?? 'default',
          separator: command.separator ?? false,
          // A command with an on state is the bar's own toggle button.
          toggle: command.active !== undefined,
          checked: command.active === true,
        })))}
        // Beside the icon, not under it: a CommandBar only shows labels it has
        // placed underneath once the bar is open, so 'bottom' on a closed bar
        // is a row of unlabelled glyphs. A dense bar drops them altogether and
        // leaves the naming to the overflow menu, which is what Fluent does
        // with a row of icon tools.
        labels={density === 'compact' || floating ? 'collapsed' : 'right'}
        onPress={event => commands[event.nativeEvent.index]?.onPress?.()}
        style={floating ? styles.floatingCommandBar : styles.commandBar}
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
function DrawnToolbar({commands, leading, trailing, field, fieldCommands = [], placement = 'bottom', density = 'regular', floating = false, foldCommands = false, children, style, testID}: ToolbarProps) {
  const {gap, edge} = DENSITY[density];
  // Measured whether or not it folds: a frame is reported only when the bar
  // is laid out again, so a handler added with the fold would wait for the
  // next resize. Kept as the size class, so the bar renders again only when
  // it crosses it.
  const [compact, setCompact] = useState(false);
  const folded = foldCommands && compact;
  // Commands drawn by the kit, as the other platforms draw them: a field
  // keeps them out of the CommandBar, which cannot hold one.
  const described = hasCommands(commands);
  const {primary, secondary} = described
    ? folded ? {primary: [], secondary: commands} : splitCommands(commands)
    : {primary: [], secondary: []};
  return (
    <Surface
      {...barSurface(floating, placement)}
      onLayout={(event: LayoutChangeEvent) => setCompact(isCompact(event.nativeEvent.layout.width))}
      style={[floating ? styles.floatingDrawn : styles.bar, {paddingHorizontal: edge}, style]}
      testID={testID}>
      <View style={[styles.row, {gap}]}>
        <Group gap={gap}>{described ? <CommandButtons commands={primary}/> : leading}</Group>
        {field != null ? <View style={styles.field}>{field}</View> : floating ? null : <View style={styles.spacer}/>}
        <Group gap={gap}>
          {fieldCommands.length > 0 ? <CommandButtons commands={fieldCommands}/> : null}
          {described ? <Overflow commands={secondary}/> : trailing}
        </Group>
      </View>
      {children}
    </Surface>
  );
}

/** Commands as the kit's own buttons, each an island of its own. */
function CommandButtons({commands}: {commands: ToolbarCommand[]}) {
  if (commands.length === 0) return null;
  return (
    <>
      {commands.map((command, index) => (
        <Button
          key={index}
          variant="text"
          size="small"
          pressed={command.active}
          label={command.label}
          prefixIcon={command.icon}
          hideLabel={command.hideLabel}
          tone={command.tone}
          role={command.role}
          disabled={command.disabled}
          onPress={command.onPress}
          testID={command.testID}
        />
      ))}
    </>
  );
}

/** The commands that asked to live behind the ellipsis, or were folded there. */
function Overflow({commands}: {commands: ToolbarCommand[]}) {
  if (commands.length === 0) return null;
  return (
    <Menu
      label="More"
      hideLabel
      icon={MORE}
      variant="text"
      size="small"
      items={commands.map(command => ({
        label: command.label,
        icon: command.icon,
        role: command.role,
        disabled: command.disabled,
        separator: command.separator,
        onPress: command.onPress,
      }))}
    />
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
  // Floating: the width of the commands, as the bar measures them.
  floatingBar: {
    alignSelf: 'flex-start',
  },
  floatingCommandBar: {
    height: COMPACT_HEIGHT,
  },
  floatingDrawn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.one,
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
