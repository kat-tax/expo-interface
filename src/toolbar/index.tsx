import type {ReactNode} from 'react';
import type {ToolbarCommand, ToolbarProps} from './types';
import {Platform, StyleSheet, View} from 'react-native';
import {Row, Spacer} from '@expo/ui';
import {Button} from '../button';
import {NativeHost} from '../host';
import {Menu} from '../menu';
import {Surface} from '../surface';
import {icon as iconToken} from '../icons';
import {spacing} from '../theme';
import {hasCommands, splitCommands} from './shared';

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
 * facing the content; the controls are native.
 */
export function Toolbar({commands, leading, trailing, field, placement = 'bottom', density = 'regular', children, style, testID}: ToolbarProps) {
  const {gap, edge} = DENSITY[density];
  // Commands replace the two slots: a bar is described either way round, not
  // both. Here the kit draws them; on Windows the platform's own bar does.
  const described = hasCommands(commands);
  const start = described ? <Commands commands={splitCommands(commands).primary} gap={gap}/> : leading;
  const end = described ? <Overflow commands={splitCommands(commands).secondary}/> : trailing;
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
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

/** The commands the bar shows, as the kit's own buttons, in a row of their own at the bar's pitch. */
function Commands({commands, gap}: {commands: ToolbarCommand[]; gap: number}) {
  if (commands.length === 0) return null;
  return (
    <Row alignment="center" spacing={COMMAND_GAP ?? gap}>
      {commands.map((command, index) => (
        <Button
          key={index}
          variant={command.active ? 'filled' : 'text'}
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
      ))}
    </Row>
  );
}

/** The ellipsis, and the commands that asked to live behind it. */
const MORE = iconToken({ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz', windows: 'E712'});

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
