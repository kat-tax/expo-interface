import type {ReactNode} from 'react';
import type {ToolbarCommand, ToolbarProps} from './types';
import {StyleSheet, View} from 'react-native';
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
 * A bar of tools along a canvas (see {@link ToolbarProps}). The bar itself
 * is a `Surface` in the screen's background with a hairline on the edge
 * facing the content; the controls are native.
 */
export function Toolbar({commands, leading, trailing, field, placement = 'bottom', density = 'regular', children, style, testID}: ToolbarProps) {
  const {gap, edge} = DENSITY[density];
  // Commands replace the two slots: a bar is described either way round, not
  // both. Here the kit draws them; on Windows the platform's own bar does.
  const described = hasCommands(commands);
  const start = described ? <Commands commands={splitCommands(commands).primary}/> : leading;
  const end = described ? <Overflow commands={splitCommands(commands).secondary}/> : trailing;
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      style={[styles.bar, {paddingHorizontal: edge}, style]}
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

/** The commands the bar shows, as the kit's own buttons. */
function Commands({commands}: {commands: ToolbarCommand[]}) {
  if (commands.length === 0) return null;
  return (
    <>
      {commands.map((command, index) => (
        <Button
          key={index}
          variant="text"
          size="small"
          label={command.label}
          prefixIcon={command.icon}
          role={command.role}
          disabled={command.disabled}
          onPress={command.onPress}
          testID={command.testID}
        />
      ))}
    </>
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
    paddingVertical: spacing.two,
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
