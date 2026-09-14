import type {CollapsibleProps} from './types';
import {Pressable, StyleSheet, View} from 'react-native';
import {Symbol} from '../symbol';
import {icon} from '../icons';
import {pressFeedback} from '../surface/shared';
import {Label} from '../typography';
import {spacing, useColor} from '../theme';
import {useExpanded} from './shared';

/** Segoe's chevrons: right while closed, down while open, as WinUI's `Expander` turns it. */
const CLOSED = icon({ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right', windows: 'E76C'});
const OPEN = icon({ios: 'chevron.down', android: 'expand_more', web: 'expand_more', windows: 'E70D'});

/**
 * Windows draws the disclosure itself: a pressable header row with the
 * label and a Segoe chevron, over the content while open. WinUI's
 * `Expander` is the same row, but its content would have to be XAML, and a
 * collapsible holds React Native content.
 */
export function Collapsible({label, expanded, defaultExpanded = false, onExpandedChange, children, testID}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const chevron = useColor('secondaryLabel');
  return (
    <View testID={testID}>
      <Pressable
        role="button"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={state => [styles.header, pressFeedback(state)]}>
        <Label color="label" style={styles.label}>{label}</Label>
        <Symbol icon={open ? OPEN : CLOSED} size={12} tintColor={chevron}/>
      </Pressable>
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
  },
  label: {
    flexShrink: 1,
  },
  content: {
    paddingTop: spacing.two,
  },
});
