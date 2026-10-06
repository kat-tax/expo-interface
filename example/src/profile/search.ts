import type {HeaderSearchPlacement} from 'expo-interface';
import {useSyncExternalStore} from 'react';

/** Every placement a header search has, with what each one draws. */
export const PLACEMENTS: readonly {value: HeaderSearchPlacement; label: string; note: string}[] = [
  {value: 'automatic', label: 'Auto', note: 'The platform\'s choice: iOS decides, Android\'s magnifier, a field beside the title on web and Windows.'},
  {value: 'stacked', label: 'Stacked', note: 'A field under the title. iOS\'s own, collapsing as the list scrolls; a row under the header elsewhere.'},
  {value: 'action', label: 'Action', note: 'A magnifier among the header\'s actions that opens into a field across the bar: Android\'s search, iOS 26\'s bar button.'},
  {value: 'inline', label: 'Inline', note: 'A field in the bar beside the title, the desktop look: frameless on web, where the bar is its frame.'},
  {value: 'integrated', label: 'Integrated', note: 'The search in a bottom toolbar: iOS 26\'s glass, a bottom bar with the field elsewhere.'},
];

let placement: HeaderSearchPlacement = 'automatic';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Where the Drops screen's search goes, for the whole app. */
export function useSearchPlacement(): HeaderSearchPlacement {
  return useSyncExternalStore(subscribe, () => placement, () => placement);
}

export function setSearchPlacement(next: HeaderSearchPlacement) {
  if (next === placement) return;
  placement = next;
  for (const listener of listeners) listener();
}
