import type {ListItemProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';
import {ListItem as UIListItem} from '@expo/ui';
import {Image, SwipeActions, Text} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, background, foregroundStyle, listRowBackground} from '@expo/ui/swift-ui/modifiers';
import {Badge} from '../badge';
import {Button} from '../button';
import {NativeHost, useNativeHost} from '../host';
import {TONE_TOKEN, symbolName} from '../icons';
import {useColor} from '../theme';
import {ROW_ICON, rowLabel, useBadgeColors} from './shared';

/**
 * iOS renders the universal `@expo/ui` `ListItem` (a SwiftUI list row)
 * through explicit slot props. An `action` is the kit's `Button` at the end
 * of the trailing slot, after any `trailing` content; the row itself only
 * responds when it also has an `onPress`. `inset` has nothing to turn off
 * here: the row is a bare `HStack` and every inset comes from the SwiftUI
 * `Form` around it.
 *
 * A selected row draws the selected fill behind its content and as the
 * row's own background, which a SwiftUI `List` or `Form` draws edge to edge.
 *
 * `swipeActions` become the system's own `swipeActions`: revealed by a swipe
 * from the trailing edge, with a full swipe running the destructive one the
 * way Mail's does.
 *
 * A SwiftUI row draws nothing outside a host. A row that finds no host above
 * it (a `ScrollView` of rows in a React Native screen) mounts one of its own,
 * as wide as its container and as tall as the row; inside a `FieldGroup`, a
 * `Screen native` or a `Sheet`'s native content it renders bare.
 */
export function ListItem(props: ListItemProps) {
  const hosted = useNativeHost();
  const row = <ListItemRow {...props}/>;
  return hosted ? row : <NativeHost>{row}</NativeHost>;
}

function ListItemRow({children, icon, iconTone = 'secondary', leading, value, badge, badgeColor, trailing, action, supporting, selected = false, swipeActions, onPress, testID}: ListItemProps) {
  const toned = useColor(TONE_TOKEN[iconTone]);
  const subtle = useColor('secondaryLabel');
  const selectedFill = useColor('backgroundSelected');
  const badgeColors = useBadgeColors(badgeColor);
  const filled = action?.variant === 'filled';
  // The row's name, composed from its slots, and its state.
  const modifiers: ViewModifier[] = [];
  const label = rowLabel({children, supporting, value, badge});
  if (label) modifiers.push(accessibilityLabel(label));
  // In a SwiftUI List or Form the row keeps the list's insets around its
  // content, so a fill on the content alone stops short of the row's edges:
  // `listRowBackground` fills the row, and SwiftUI ignores it anywhere else,
  // where the content's fill is the row's. The fill is opaque, so the two
  // read as one where both draw.
  if (selected) modifiers.push(background({type: 'color', color: selectedFill}), listRowBackground(selectedFill), accessibilityAddTraits(['isSelected']));
  const symbol = icon ? symbolName(icon, 'ios') : undefined;
  const leadingContent = symbol ? (
    <>
      <Image systemName={symbol as never} color={toned} size={ROW_ICON}/>
      {leading}
    </>
  ) : leading;
  const marks = value != null || badge ? (
    <>
      {value != null ? <Text modifiers={[foregroundStyle({type: 'color', color: subtle})]}>{value}</Text> : null}
      {badge ? <Badge count={typeof badge === 'number' ? badge : undefined} dot={badge === true} {...badgeColors}/> : null}
    </>
  ) : null;
  const trailingContent = marks || action ? (
    <>
      {marks}
      {trailing}
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
  ) : trailing;
  const row = (
    <UIListItem
      onPress={onPress}
      leading={leadingContent}
      trailing={trailingContent}
      supportingText={supporting}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
      testID={testID}>
      {children}
    </UIListItem>
  );
  if (!swipeActions || swipeActions.length === 0) return row;
  // The system's own swipe, which is the gesture iOS teaches for a row's
  // actions. A full swipe runs the destructive one, as Mail's does.
  return (
    <SwipeActions>
      {row}
      <SwipeActions.Actions edge="trailing" allowsFullSwipe={swipeActions.some(a => a.role === 'destructive')}>
        {swipeActions.map((swipe, index) => (
          <Button
            key={index}
            label={swipe.label}
            prefixIcon={swipe.icon}
            role={swipe.role === 'destructive' ? 'destructive' : 'default'}
            disabled={swipe.disabled}
            onPress={swipe.onPress}
          />
        ))}
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

export type {ListItemProps} from './types';
