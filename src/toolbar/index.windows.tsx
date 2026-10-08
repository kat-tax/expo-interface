import type {ReactNode} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import type {ToolbarCommand, ToolbarProps} from './types';
import {Fragment, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlCommandBar from '../windows/specs/ExpoInterfaceCommandBarNativeComponent';
import {glyphOf, jsonProp, useXamlProps} from '../windows';
import {Surface} from '../surface';
import {fromLeft, useAnchored} from '../anchored';
import {Button} from '../button';
import {Divider} from '../divider';
import {Menu} from '../menu';
import {menuEntries, useMenuShortcuts} from '../menu/windows';
import {isCompact} from '../size-class';
import {spacing} from '../theme';
import {MORE} from '../glyphs';
import {anchoredStyles, commandDisabled, hasCommands, overflowItems, splitCommands} from './shared';

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

/** How a placed bar reports its width, to the size class `foldCommands` reads. */
interface Measured {
  onMeasure: (event: LayoutChangeEvent) => void;
}

/**
 * A bar where it is laid out: the platform's `CommandBar` for commands, the
 * kit's otherwise.
 *
 * Both bars are measured, and the size class is kept here rather than in the
 * drawn bar. The documented fold opens a field on a bar of commands, which
 * swaps the `CommandBar` for the drawn bar: one that measured itself would
 * start unmeasured, draw every command beside the field, and fold only once
 * its own first layout came. Both run the width of the edge they sit on, so
 * the class carries over.
 */
function PlacedToolbar(props: ToolbarProps) {
  const [compact, setCompact] = useState(false);
  const onMeasure = (event: LayoutChangeEvent) => setCompact(isCompact(event.nativeEvent.layout.width));
  if (hasCommands(props.commands) && props.field == null) return <NativeToolbar {...props} onMeasure={onMeasure}/>;
  return <DrawnToolbar {...props} compact={compact} onMeasure={onMeasure}/>;
}

/**
 * A floating bar beside a rectangle, laid over its parent: lined up with the
 * rectangle by `align` (centred on it unless asked otherwise), over it unless
 * there is no room, inside the parent less its insets, and drawn only once it
 * has been measured and placed.
 */
function AnchoredToolbar(props: ToolbarProps) {
  const {at = null, align = 'center', preferredEdge = 'top', insets, testID} = props;
  const anchored = useAnchored({at, preferredEdge, insets, align});
  return (
    <View style={anchoredStyles.bounds} onLayout={anchored.onBounds} testID={testID ? `${testID}-bounds` : undefined}>
      {at ? (
        <View
          onLayout={anchored.onCard}
          style={[anchoredStyles.bar, fromLeft(anchored.left), {top: anchored.top}, anchored.placed ? null : anchoredStyles.unplaced]}>
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

function NativeToolbar({commands = [], placement = 'bottom', density = 'regular', floating = false, children, style, testID, onMeasure}: ToolbarProps & Measured) {
  const xaml = useXamlProps();
  // A menu command's entries bind their shortcuts while the bar is up, as
  // WinUI's accelerators are; a disabled command's do not.
  useMenuShortcuts(commands.flatMap(command => (command.items && !command.disabled ? command.items : [])));
  return (
    <Surface
      {...barSurface(floating, placement)}
      onLayout={onMeasure}
      style={[floating ? styles.floatingBar : styles.nativeBar, style]}
      testID={testID}>
      <XamlCommandBar
        commands={jsonProp(commands.map(command => {
          // A menu takes no press of its own, so no role and no on state.
          const press = !command.items;
          return {
            label: command.label,
            glyph: glyphOf(command.icon),
            secondary: command.secondary ?? false,
            // A menu with no entries too, which would open on nothing.
            disabled: commandDisabled(command),
            role: press ? command.role ?? 'default' : 'default',
            separator: command.separator ?? false,
            // A command with an on state is the bar's own toggle button.
            toggle: press && command.active !== undefined,
            checked: press && command.active === true,
            // A menu command is a button with its MenuFlyout: a chevron on the bar, a submenu in the overflow.
            ...(command.items ? {menu: menuEntries(command.items)} : {}),
          };
        }))}
        // Beside the icon, not under it: a CommandBar only shows labels it has
        // placed underneath once the bar is open, so 'bottom' on a closed bar
        // is a row of unlabelled glyphs. A dense bar drops them altogether and
        // leaves the naming to the overflow menu, which is what Fluent does
        // with a row of icon tools.
        labels={density === 'compact' || floating ? 'collapsed' : 'right'}
        // A command by its index; a menu command's entry by the index of the
        // pick in its menu, where -1 is the press that opened the flyout.
        onPress={event => {
          const {index, item} = event.nativeEvent;
          const command = commands[index];
          if (command?.items) command.items[item]?.onPress?.();
          else command?.onPress?.();
        }}
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
function DrawnToolbar({commands, leading, trailing, field, fieldCommands = [], placement = 'bottom', density = 'regular', floating = false, foldCommands = false, children, style, testID, compact, onMeasure}: ToolbarProps & Measured & {compact: boolean}) {
  const {gap, edge} = DENSITY[density];
  // Measured whether or not it folds (see `PlacedToolbar`): a frame is
  // reported only when the bar is laid out again, so a handler added with
  // the fold would wait for the next resize. Kept as the size class, so the
  // bar renders again only when it crosses it. A floating bar is the width of
  // its controls, so it never folds, as on the other platforms.
  const folded = foldCommands && !floating && compact;
  // Commands drawn by the kit, as the other platforms draw them: a field
  // keeps them out of the CommandBar, which cannot hold one.
  const described = hasCommands(commands);
  const {primary, secondary} = described
    ? folded ? {primary: [], secondary: commands} : splitCommands(commands)
    : {primary: [], secondary: []};
  return (
    <Surface
      {...barSurface(floating, placement)}
      onLayout={onMeasure}
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

/**
 * Commands as the kit's own buttons, each an island of its own; a command
 * with `items` is the kit's own `Menu`, its button and its `MenuFlyout`,
 * whose entries are greyed out with it, so their shortcuts are not bound
 * while it is disabled; with no entries it is greyed out itself. A command
 * with `separator` has a vertical rule
 * before it, none before the first of the group, as a menu's entries do.
 */
function CommandButtons({commands}: {commands: ToolbarCommand[]}) {
  if (commands.length === 0) return null;
  return (
    <>
      {commands.map((command, index) => (
        <Fragment key={index}>
          {command.separator && index > 0 ? <Divider vertical/> : null}
          {command.items ? (
            <Menu
              variant="text"
              size="small"
              label={command.label}
              icon={command.icon}
              hideLabel={command.hideLabel}
              tone={command.tone}
              disabled={commandDisabled(command)}
              items={command.disabled ? command.items.map(item => ({...item, disabled: true})) : command.items}
              testID={command.testID}
            />
          ) : (
            <Button
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
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * The commands that asked to live behind the ellipsis, or were folded there.
 * With no entries to show, no commands or only menus with none, there is no
 * ellipsis: it would open on nothing.
 */
function Overflow({commands}: {commands: ToolbarCommand[]}) {
  const items = overflowItems(commands);
  if (items.length === 0) return null;
  return (
    <Menu
      label="More"
      hideLabel
      icon={MORE}
      variant="text"
      size="small"
      items={items}
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
