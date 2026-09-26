import type {WindowsPane} from 'expo-interface';
import {useSyncExternalStore} from 'react';

/** Every pane display mode a WinUI `NavigationView` has, with what each one draws. */
export const PANES: readonly {value: WindowsPane; label: string; note: string}[] = [
  {value: 'top', label: 'Top', note: 'The sections in a row along the top of the window.'},
  {value: 'left', label: 'Left', note: 'The pane down the left, labels beside the glyphs. Its button collapses it to the glyphs beside the content.'},
  {value: 'compact', label: 'Compact', note: 'The pane at its glyph width beside the content. Its button opens the pane over the content.'},
  {value: 'minimal', label: 'Minimal', note: 'The pane\'s button alone, at the top start of the content. The pane opens over the content from there.'},
  {value: 'auto', label: 'Auto', note: 'Left from 1008 points of width, compact from 641, minimal in a narrower window: WinUI\'s own breakpoints.'},
];

let pane: WindowsPane = 'top';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The pane the tabs draw on Windows, for the whole app. */
export function usePane(): WindowsPane {
  return useSyncExternalStore(subscribe, () => pane, () => pane);
}

export function setPane(next: WindowsPane) {
  if (next === pane) return;
  pane = next;
  for (const listener of listeners) listener();
}
