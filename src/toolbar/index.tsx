import type {ReactNode} from 'react';
import type {ToolbarCommand, ToolbarProps} from './types';
import type {LayoutChangeEvent} from 'react-native';
import {Fragment, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Row, Spacer} from '@expo/ui';
import {Button} from '../button';
import {Divider} from '../divider';
import {NativeHost} from '../host';
import {Menu} from '../menu';
import {Surface} from '../surface';
import {useAnchored} from '../anchored';
import {MORE} from '../glyphs';
import {isCompact} from '../size-class';
import {spacing} from '../theme';
import {FloatingSurface} from './floating';
import {anchoredStyles, hasCommands, overflowItems, splitCommands} from './shared';

/**
 * Space between the controls, and at the bar's ends. `compact` is what a bar
 * of many icon tools needs on a narrow screen; the vertical padding, and so
 * the bar's height, is the same either way.
 */
const DENSITY = {
  regular: {gap: spacing.two, edge: spacing.three},
  compact: {gap: spacing.half, edge: spacing.two},
} as const;

/**
 * What a command draws at: the platform's own bar metrics. On iOS a 22pt
 * symbol at the bar button's control size, as the header's actions, since a
 * `small` button's 16pt symbol is a bar too fine for a thumb; on Android a
 * 22dp icon in Material's 48dp icon button, a touch under the app bar's 24,
 * which reads large in a row of tools; on web the kit's small button.
 */
const TOOL = Platform.select({
  ios: {size: 'large', iconSize: 22},
  android: {size: 'medium', iconSize: 22},
  default: {size: 'small', iconSize: undefined},
} as const);

/**
 * Between the commands: the bar's own pitch, whatever the density. On iOS a
 * plain button is exactly its symbol, so the space makes the 44pt pitch of
 * a toolbar's items; on Android the icon buttons carry a 48dp container
 * each, which is the pitch; on web the small buttons take the density's gap
 * (`undefined` here leaves the row's).
 */
const COMMAND_GAP = Platform.select({ios: 22, android: 0, default: undefined});

/**
 * Above and below the controls. None on Android, where Material's icon
 * buttons carry a 48dp container of their own: the bar is that container,
 * as the app bar's row is, and padding it as well made a 64dp bar.
 */
const PADDING_VERTICAL = Platform.select({android: 0, default: spacing.two});

/**
 * A bar of tools along a canvas (see {@link ToolbarProps}). The bar itself
 * is a `Surface` in the screen's background with a hairline on the edge
 * facing the content; the controls are native. A floating bar is raised and
 * rounded instead, and one at a rectangle floats over its parent beside it.
 */
export function Toolbar(props: ToolbarProps) {
  if (props.at !== undefined) return <AnchoredToolbar {...props}/>;
  if (props.floating) return <FloatingToolbar {...props}/>;
  return <EdgeToolbar {...props}/>;
}

/**
 * The controls a bar holds: its commands and their overflow, or its two
 * slots, with the field's commands first in the trailing group. A folded bar
 * puts every command behind the overflow.
 */
function controlsOf({commands, leading, trailing, fieldCommands = []}: ToolbarProps, gap: number, folded = false) {
  const besideField = fieldCommands.length > 0 ? <Commands commands={fieldCommands} gap={gap}/> : null;
  // Commands replace the two slots: a bar is described either way round, not
  // both. Here the kit draws them; on Windows the platform's own bar does.
  if (!hasCommands(commands)) return {start: leading, end: besideField ? <>{besideField}{trailing}</> : trailing};
  const {primary, secondary} = folded ? {primary: [], secondary: commands} : splitCommands(commands);
  return {start: <Commands commands={primary} gap={gap}/>, end: <>{besideField}<Overflow commands={secondary}/></>};
}

/** A floating bar where it is laid out. */
function FloatingToolbar(props: ToolbarProps) {
  const {gap} = DENSITY[props.density ?? 'regular'];
  const {start, end} = controlsOf(props, gap);
  return (
    <FloatingSurface gap={gap} style={props.style} testID={props.testID}>
      {start}
      {end}
    </FloatingSurface>
  );
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
          style={[anchoredStyles.bar, {left: anchored.left, top: anchored.top}, anchored.placed ? null : anchoredStyles.unplaced]}>
          <FloatingToolbar {...props}/>
        </View>
      ) : null}
    </View>
  );
}

/** The bar along an edge of its content. */
function EdgeToolbar(props: ToolbarProps) {
  const {field, placement = 'bottom', density = 'regular', foldCommands = false, children, style, testID} = props;
  const {gap, edge} = DENSITY[density];
  // Measured whether or not it folds: React Native reports a frame only when
  // it is laid out again, and react-native-web observes a view only from its
  // mount, so a handler added with the fold would wait for the next resize.
  // Kept as the size class, so the bar renders again only when it crosses it.
  const [compact, setCompact] = useState(false);
  const {start, end} = controlsOf(props, gap, foldCommands && compact);
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      onLayout={(event: LayoutChangeEvent) => setCompact(isCompact(event.nativeEvent.layout.width))}
      style={[styles.bar, {paddingHorizontal: edge, paddingVertical: PADDING_VERTICAL}, style]}
      testID={testID}>
      {field == null ? (
        // One host: the whole bar of controls is a single native view.
        <NativeHost>
          <Row alignment="center" spacing={gap}>
            {start}
            <Spacer flexible/>
            {end}
          </Row>
        </NativeHost>
      ) : (
        <View style={[styles.row, {gap}]}>
          <Group gap={gap}>{start}</Group>
          <View style={styles.field}>{field}</View>
          <Group gap={gap}>{end}</Group>
        </View>
      )}
      {children}
    </Surface>
  );
}

/**
 * The commands the bar shows, as the kit's own buttons, in a row of their own
 * at the bar's pitch. A command with `separator` has a vertical rule before
 * it, none before the first of the row, as a menu's entries do.
 */
function Commands({commands, gap}: {commands: ToolbarCommand[]; gap: number}) {
  if (commands.length === 0) return null;
  return (
    <Row alignment="center" spacing={COMMAND_GAP ?? gap}>
      {commands.map((command, index) => (
        <Fragment key={index}>
          {command.separator && index > 0 ? <Divider vertical/> : null}
          <Button
            variant="text"
            pressed={command.active}
            size={TOOL.size}
            iconSize={TOOL.iconSize}
            label={command.label}
            prefixIcon={command.icon}
            hideLabel={command.hideLabel}
            tone={command.tone}
            role={command.role}
            disabled={command.disabled}
            onPress={command.onPress}
            testID={command.testID}
          />
        </Fragment>
      ))}
    </Row>
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
      size={TOOL.size}
      iconSize={TOOL.iconSize}
      items={overflowItems(commands)}
    />
  );
}

/** One side's controls, in a host of their own beside a React Native field. */
function Group({gap, children}: {gap: number; children?: ReactNode}) {
  if (!children) return null;
  return (
    <NativeHost fit>
      <Row alignment="center" spacing={gap}>{children}</Row>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    // Between the control row and the second row, not between the controls.
    gap: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
  },
});
