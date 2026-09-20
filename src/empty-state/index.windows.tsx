import type {EmptyStateProps} from './types';
import {Icon} from '../symbol';
import {useColor} from '../theme';
import {EMPTY_ICON, EmptyStateLayout} from './shared';

/**
 * Windows draws the column too: WinUI has no single control for an empty
 * state, and `expo-symbols` is not on this platform, so the glyph is the kit's
 * own `Icon` — a Segoe Fluent character — rather than `SymbolView`.
 */
export function EmptyState({icon, ...props}: EmptyStateProps) {
  const muted = useColor('secondaryLabel');
  return (
    <EmptyStateLayout
      {...props}
      icon={icon ? <Icon icon={icon} size={EMPTY_ICON} tintColor={muted}/> : undefined}
    />
  );
}
