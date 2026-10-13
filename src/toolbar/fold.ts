import type {LayoutChangeEvent} from 'react-native';
import type {ToolbarCommand} from './types';
import {useState} from 'react';
import {hasCommands, splitCommands} from './shared';

/** The commands on a bar and the ones behind its overflow menu, in the order the menu lists them. */
export interface CommandSplit {
  primary: ToolbarCommand[];
  secondary: ToolbarCommand[];
}

/** How a bar at a rectangle folds what does not fit its room. */
export interface Fold {
  /**
   * The commands on the bar and the ones behind the overflow, the folded
   * ones first among the latter, before the `secondary` ones; `undefined`
   * for a bar given no commands.
   */
  split: CommandSplit | undefined;
  /**
   * Whether the bar fits the room, or has nothing left to fold: false while
   * a fold has still to be laid out, so the bar is not placed from a width
   * it is about to lose.
   */
  fits: boolean;
  /**
   * A key for the bar's view, new with each fold and each new shape, so the
   * bar is laid out afresh and reports its width. A view whose frame does
   * not change reports no layout, and the first fold, which swaps a command
   * for the More button, may well leave the width as it was.
   */
  key: string;
  /** Takes the bar's layout. */
  onLayout: (event: LayoutChangeEvent) => void;
}

interface FoldState {
  /** The shape the fold was made for. */
  shape: string;
  /** The room the fold was made for. */
  room: number;
  /** How many trailing primary commands are behind the overflow. */
  folded: number;
  /** The width the bar reported with this fold; 0 until it has. */
  width: number;
  /** Counts the folds and the starts over, for the view's key. */
  generation: number;
}

/**
 * What of the commands sets the bar's width: how many there are, the labels
 * they show, whether each hides its label and has an icon, and which are
 * behind the overflow or after a rule. Not the array itself, which an app
 * rebuilds each render, not a state (`active`, `disabled`, `color`), which
 * changes nothing of the width, and not a hidden label (a count a screen
 * reader hears), which changes nothing of it either.
 */
export function shapeOf(commands: readonly ToolbarCommand[] | undefined): string {
  return (commands ?? [])
    .map(command => `${command.hideLabel ? '' : command.label}\u001f${command.hideLabel ? 1 : 0}${command.icon ? 1 : 0}${command.secondary ? 1 : 0}${command.separator ? 1 : 0}`)
    .join('\u001e');
}

/**
 * Folds the trailing primary commands of a bar at a rectangle that does not
 * fit its room behind the overflow menu, as `foldCommands` folds along an
 * edge, one at a time: each layout the bar reports wider than the room with
 * a primary command left folds one more, and the bar is laid out again
 * without it (`key`), until it fits or every one is behind the menu. The
 * first fold adds the More button, so it may gain nothing by itself; the
 * next takes care of that.
 *
 * Other commands (`shapeOf`) start the fold over, as does more room, since
 * fewer may fit now; less room folds on from where it is, since what did not
 * fit before does not fit now. With no room measured yet nothing folds. The
 * fold is worked out in the render, from the width the last layout reported,
 * in guarded state updates, so a bar is never drawn from a fold it is about
 * to change.
 */
export function useFold(commands: readonly ToolbarCommand[] | undefined, room: number): Fold {
  const shape = shapeOf(commands);
  const [state, setState] = useState<FoldState>({shape, room, folded: 0, width: 0, generation: 0});
  const {primary, secondary} = splitCommands(commands ?? []);
  let {folded, width, generation} = state;
  if (state.shape !== shape || (room > state.room && folded > 0)) {
    folded = 0;
    width = 0;
    generation += 1;
  }
  // Too wide, with a primary command left to fold: one more goes behind the
  // overflow, and the bar's width is unknown until it is laid out without it.
  if (room > 0 && width > room && folded < primary.length) {
    folded += 1;
    width = 0;
    generation += 1;
  }
  if (state.shape !== shape || state.room !== room || state.folded !== folded || state.width !== width) {
    setState({shape, room, folded, width, generation});
  }
  const kept = primary.length - folded;
  const canFold = folded < primary.length;
  return {
    split: hasCommands(commands) ? {primary: primary.slice(0, kept), secondary: [...primary.slice(kept), ...secondary]} : undefined,
    fits: !canFold || room <= 0 || (width > 0 && width <= room),
    key: String(generation),
    onLayout: event => {
      const next = event.nativeEvent.layout.width;
      // A layout of the view this fold made, not of one a fold before it unmounted.
      setState(current => (current.generation !== generation || current.width === next ? current : {...current, width: next}));
    },
  };
}
