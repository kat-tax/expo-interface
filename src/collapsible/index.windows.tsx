import type {CollapsibleProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Icon} from '../symbol';
import {icon} from '../icons';
import {StatePressable} from '../surface/pressable';
import {pressFeedback} from '../surface/shared';
import {Label} from '../typography';
import {spacing, useColor} from '../theme';
import {useExpanded} from './shared';

/** Segoe's chevrons: right while closed, down while open, as WinUI's `Expander` turns it. */
const CLOSED = icon({ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right', windows: 'E76C'});
const OPEN = icon({ios: 'chevron.down', android: 'expand_more', web: 'expand_more', windows: 'E70D'});

/**
 * Windows draws the disclosure itself: a pressable header row with the
 * label and a Segoe chevron, over the content while open — WinUI's subtle
 * fill under the pointer, the focus ring, Enter and Space, as an `Expander`
 * header has. The `Expander` itself is the same row, but its content would
 * have to be XAML, and a collapsible holds React Native content.
 */
export function Collapsible({label, expanded, defaultExpanded = false, onExpandedChange, children, testID}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const chevron = useColor('secondaryLabel');
  return (
    <View testID={testID}>
      <StatePressable
        role="button"
        accessibilityLabel={label}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={state => [styles.header, pressFeedback(state, 'subtle')]}>
        <Label color="label" style={styles.label}>{label}</Label>
        <Icon icon={open ? OPEN : CLOSED} size={12} tintColor={chevron}/>
      </StatePressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.two,
    minHeight: 40,
    paddingHorizontal: spacing.one,
    marginHorizontal: -spacing.one,
    borderRadius: 4,
  },
  label: {
    flexShrink: 1,
  },
  content: {
    paddingTop: spacing.two,
  },
});
