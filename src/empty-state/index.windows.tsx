import type {EmptyStateProps} from './types';
import {Spinner} from '../spinner';
import {Icon} from '../symbol';
import {useColor} from '../theme';
import {EMPTY_ICON, EmptyStateLayout} from './shared';

/**
 * Windows draws the column too: WinUI has no single control for an empty
 * state, and `expo-symbols` is not on this platform, so the glyph is the kit's
 * own `Icon` — a Segoe Fluent character — rather than `SymbolView`, and the
 * spinner the WinUI `ProgressRing`.
 */
export function EmptyState({icon, loading = false, ...props}: EmptyStateProps) {
  const muted = useColor('secondaryLabel');
  return (
    <EmptyStateLayout
      {...props}
      icon={loading ? <Spinner size={EMPTY_ICON}/> : icon ? <Icon icon={icon} size={EMPTY_ICON} tintColor={muted}/> : undefined}
    />
  );
}
