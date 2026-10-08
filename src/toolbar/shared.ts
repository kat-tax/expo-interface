import type {MenuItem} from '../menu/types';
import type {ToolbarCommand} from './types';
import {StyleSheet} from 'react-native';

/**
 * The commands that go on the bar, and the ones that go behind the overflow.
 *
 * Windows hands the whole list to `CommandBar` and lets it decide what fits;
 * everywhere else the kit draws the split itself, so it has to make it. A
 * command that asked to be secondary is secondary on every platform.
 */
export function splitCommands(commands: readonly ToolbarCommand[]): {
  primary: ToolbarCommand[];
  secondary: ToolbarCommand[];
} {
  return {
    primary: commands.filter(command => !command.secondary),
    secondary: commands.filter(command => command.secondary),
  };
}

/**
 * The overflow menu's entries for the commands behind it, on every bar the
 * kit draws. A toggle keeps its state as the menu's check while it is on: a
 * menu has no off state, so one that is off is a plain entry, as the
 * platforms' own menus show it.
 */
export function overflowItems(commands: readonly ToolbarCommand[]): MenuItem[] {
  return commands.map(command => ({
    label: command.label,
    icon: command.icon,
    active: command.active,
    role: command.role,
    disabled: command.disabled,
    separator: command.separator,
    onPress: command.onPress,
  }));
}

/** Styles the anchored bar shares on every platform. */
export const anchoredStyles = StyleSheet.create({
  // The overlay covers its parent and takes no presses of its own.
  bounds: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  bar: {
    position: 'absolute',
  },
  // Until it is measured and placed, the bar is neither seen nor pressed.
  unplaced: {
    opacity: 0,
    pointerEvents: 'none',
  },
});

/** Whether a bar was given commands to draw at all. */
export function hasCommands(commands: readonly ToolbarCommand[] | undefined): commands is ToolbarCommand[] {
  return !!commands && commands.length > 0;
}
