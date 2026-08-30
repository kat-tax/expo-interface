import type {CollapsibleProps} from './types';

import {DisclosureGroup, Text} from '@expo/ui/swift-ui';
import {foregroundStyle} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';
import {useExpanded} from './shared';

/**
 * iOS renders SwiftUI's `DisclosureGroup`: a row with the label and a
 * trailing chevron that rotates open, with the content revealed below. Drop
 * it straight into a `FieldGroup.Section`.
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
  return (
    <DisclosureGroup isExpanded={open} onIsExpandedChange={setOpen} testID={testID}>
      <DisclosureGroup.Label>
        <Text modifiers={[foregroundStyle(labelColor)]}>{label}</Text>
      </DisclosureGroup.Label>
      {children}
    </DisclosureGroup>
  );
}
