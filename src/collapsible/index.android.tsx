import type {CollapsibleProps} from './types';

import {Collapsible as UICollapsible} from '@expo/ui';
import {Column} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
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
  testID,
}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const labelColor = useColor('label');
  const collapsible = (
    <UICollapsible isOpen={open} onOpenChange={setOpen} label={label} labelStyle={{color: labelColor}}>
      {children}
    </UICollapsible>
  );
  // `@expo/ui`'s universal Collapsible takes no testID, so a full-width
  // Compose wrapper carries it.
  if (testID == null) return collapsible;
  return <Column modifiers={[fillMaxWidth(), testIDModifier(testID)]}>{collapsible}</Column>;
}
