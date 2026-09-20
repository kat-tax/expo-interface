import type {SearchFieldProps} from './types';

/** The default name for a field nobody gave a placeholder. */
export const SEARCH_LABEL = 'Search';

/**
 * The completions that match what has been typed.
 *
 * `contains` and not `startsWith`: someone searching a list of file names is
 * as likely to remember the middle of one as the beginning. Nothing typed
 * means nothing offered, so the list does not open over the content the moment
 * the field takes focus.
 */
export function matchingSuggestions(value: string, suggestions: readonly string[] | undefined): string[] {
  const query = value.trim().toLowerCase();
  if (!query || !suggestions) return [];
  return suggestions.filter(suggestion => suggestion.toLowerCase().includes(query));
}

/** Whether the clear button has anything to do. */
export function canClear({value, clearable = true, disabled}: SearchFieldProps): boolean {
  return clearable && !disabled && value.length > 0;
}
