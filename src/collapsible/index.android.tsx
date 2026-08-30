import type {CollapsibleProps} from './types';

import {Collapsible as UICollapsible} from '@expo/ui';
import {useColor} from '../theme';
import {useExpanded} from './shared';

/**
 * Android renders `@expo/ui`'s universal `Collapsible`, which is already the
 * Material 3 Expressive expandable list item (rounded card whose container
 * tints from transparent to `surfaceContainer` while open, animated chevron).
 * It reads the seeded Host palette, so it matches the rest of the screen.
 */
export function Collapsible({
  label,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const labelColor = useColor('label');
  return (
    <UICollapsible isOpen={open} onOpenChange={setOpen} label={label} labelStyle={{color: labelColor}}>
      {children}
    </UICollapsible>
  );
}
