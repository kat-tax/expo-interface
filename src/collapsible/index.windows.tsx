import type {CollapsibleProps} from './types';
import {useId} from 'react';
import {View} from 'react-native';
import Expander from '../windows/specs/ExpoInterfaceExpanderNativeComponent';
import {Portal} from '../windows/portal';
import {useXamlProps} from '../windows';
import {useExpanded} from './shared';

/**
 * Windows renders a WinUI 3 `Expander` in a XAML island (`ExpoInterfaceExpander`,
 * see `windows/ExpoInterface/Portal.cpp`): the header row with its chevron,
 * the subtle fill under the pointer, the focus ring, Enter and Space, and the
 * content sliding out from under the header as WinUI's own does. The content
 * is React Native, placed inside the Expander's content area by a `Portal`
 * that names the same slot, so a collapsible holds any children here as on
 * the other platforms.
 */
export function Collapsible({label, expanded, defaultExpanded = false, onExpandedChange, children, testID}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const slot = useId();
  const look = useXamlProps();
  return (
    <View>
      <Expander
        header={label}
        slot={slot}
        expanded={open}
        onToggle={event => setOpen(event.nativeEvent.expanded)}
        testID={testID}
        {...look}
      />
      <Portal slot={slot}>{children}</Portal>
    </View>
  );
}
