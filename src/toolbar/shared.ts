import type {ToolbarCommand} from './types';

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

/** Whether a bar was given commands to draw at all. */
export function hasCommands(commands: readonly ToolbarCommand[] | undefined): commands is ToolbarCommand[] {
  return !!commands && commands.length > 0;
}
