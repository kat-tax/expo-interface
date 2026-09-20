import type {EmptyStateProps} from './types';
import {SymbolView} from 'expo-symbols';
import {useColor} from '../theme';
import {EMPTY_ICON, EmptyStateLayout} from './shared';

/**
 * The drawn empty state: Android, the web, and iOS before 17, where
 * `ContentUnavailableView` does not exist yet.
 *
 * The icon is `SymbolView`, which is the kit's cross-platform glyph on those
 * three — an SF Symbol on iOS, a Material Symbol elsewhere. It is drawn in the
 * secondary colour so the title keeps the weight.
 */
export function DrawnEmptyState({icon, ...props}: EmptyStateProps) {
  const muted = useColor('secondaryLabel');
  return (
    <EmptyStateLayout
      {...props}
      icon={icon ? <SymbolView name={icon.symbol} size={EMPTY_ICON} tintColor={muted}/> : undefined}
    />
  );
}
