import type {ListItemProps} from './types';
import {ROW_ICON, WithRowMenu, rowLabel, textOf} from './shared';
import {StyleSheet, View} from 'react-native';
import {Badge} from '../badge';
import {Button} from '../button';
import {StatePressable} from '../surface/pressable';
import {pressFeedback} from '../surface/shared';
import {Icon} from '../symbol';
import {Footnote, Label} from '../typography';
import {spacing, useColor} from '../theme';

/**
 * The row, plus the platform's context menu when it has actions of its own.
 *
 * The menu takes the tap as well, because it owns the gesture on this
 * platform; the row inside it is not separately pressable, which would give
 * the same press two owners.
 */
export function ListItem({swipeActions, ...props}: ListItemProps) {
  const menued = !!swipeActions && swipeActions.length > 0;
  return (
    <WithRowMenu actions={swipeActions} onPress={props.onPress}>
      <ListItemRow {...props} onPress={menued ? undefined : props.onPress}/>
    </WithRowMenu>
  );
}

/**
 * Windows draws the row itself, as web does: a leading slot, the headline
 * over its supporting text, a trailing slot and the `action` as the kit's
 * button (a XAML island). The row is a pressable when it has an `onPress`:
 * WinUI's subtle fill under the pointer and while pressed, focusable with
 * the platform's focus ring, Enter and Space pressing it, and named for
 * assistive technology after its text. A selected row takes the selected
 * fill. Its metrics are a WinUI settings card's: 48 points tall at least,
 * 16 of padding at the ends, which a `FieldGroup.Section` supplies instead.
 */
function ListItemRow({children, icon, iconTone = 'secondary', leading, value, badge, trailing, action, supporting, selected = false, inset = true, onPress, testID}: ListItemProps) {
  const selectedFill = useColor('backgroundSelected');
  const filled = action?.variant === 'filled';
  const headline = textOf(children);
  const label = rowLabel({children, supporting, value, badge});
  const content = (
    <>
      {icon || leading != null ? (
        <View style={styles.slot}>
          {icon ? <Icon icon={icon} size={ROW_ICON} tone={iconTone}/> : null}
          {leading}
        </View>
      ) : null}
      <View style={styles.main}>
        {headline !== undefined ? <Label color="label">{headline}</Label> : children}
        {supporting != null ? (
          typeof supporting === 'string' || typeof supporting === 'number'
            ? <Footnote color="secondaryLabel">{supporting}</Footnote>
            : supporting
        ) : null}
      </View>
      {value != null || badge || trailing != null ? (
        <View style={styles.slot}>
          {value != null ? <Footnote color="secondaryLabel">{value}</Footnote> : null}
          {badge ? <Badge count={typeof badge === 'number' ? badge : undefined} dot={badge === true}/> : null}
          {trailing}
        </View>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          variant={filled ? 'filled' : 'text'}
          shape={filled ? 'rounded' : undefined}
          size="small"
          role={action.role === 'destructive' ? 'destructive' : 'default'}
          disabled={action.disabled}
          loading={action.loading}
          onPress={action.onPress}
        />
      ) : null}
    </>
  );
  const row = [styles.row, inset && styles.inset, selected && {backgroundColor: selectedFill}];
  if (onPress) {
    return (
      <StatePressable
        role="button"
        accessibilityLabel={label}
        accessibilityState={selected ? {selected: true} : undefined}
        onPress={onPress}
        style={state => [row, pressFeedback(state, 'subtle')]}
        testID={testID}>
        {content}
      </StatePressable>
    );
  }
  return (
    <View style={row} accessibilityLabel={label} accessibilityState={selected ? {selected: true} : undefined} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.three,
    minHeight: 48,
    width: '100%',
  },
  inset: {
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    gap: spacing.half,
  },
});

export type {ListItemProps} from './types';
