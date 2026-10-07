import type {EmptyStateProps} from './types';
import {Spinner} from '../spinner';
import {Icon} from '../symbol';
import {EMPTY_ICON, EmptyStateLayout} from './shared';

/**
 * The drawn empty state: the web, and iOS before 17, where
 * `ContentUnavailableView` does not exist yet.
 *
 * The icon is the kit's `Icon`: an SF Symbol on iOS, a Material Symbol on
 * the web, drawn in the secondary colour so the title keeps the weight;
 * while `loading` the kit's spinner takes its place.
 */
export function DrawnEmptyState({icon, loading = false, ...props}: EmptyStateProps) {
  return (
    <EmptyStateLayout
      {...props}
      icon={loading ? <Spinner size={EMPTY_ICON}/> : icon ? <Icon icon={icon} size={EMPTY_ICON} tone="secondary"/> : undefined}
    />
  );
}
