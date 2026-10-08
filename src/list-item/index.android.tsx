import type {ReactNode} from 'react';
import type {ListItemProps} from './types';
import {ROW_ICON, WithRowMenu, useBadgeColors} from './shared';
import {Button, CircularProgressIndicator, Column, Icon, ListItem as ComposeListItem, Row, Shape, Spacer, Text, TextButton} from '@expo/ui/jetpack-compose';
import {background, clickable, fillMaxWidth, selectable, size, testID as testIDModifier, weight, width, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {Badge} from '../badge';
import {androidContentPadding} from '../button/shared';
import {NativeHost, useNativeHost} from '../host';
import {TONE_TOKEN, drawableOf} from '../icons';
import {useColor} from '../theme';

/** The `rounded` button shape, as the kit's own `Button` draws it. */
const ROUNDED = Shape.RoundedCorner({cornerRadii: {topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12}});

/** The spinner before a loading action's label, the small button's icon size. */
const ACTION_SPINNER = 16;

const TRANSPARENT = '#00000000';

/**
 * The row, plus the platform's context menu when it has actions of its own.
 *
 * The menu takes the tap as well, because it owns the gesture on this
 * platform; the row inside it is not separately pressable, which would give
 * the same press two owners.
 *
 * A Compose row draws nothing outside a host, and says nothing about it. So
 * a row that finds no host above it (a `ScrollView` of rows in a React Native
 * screen) mounts one of its own, as wide as its container and as tall as the
 * row; inside a `FieldGroup`, a `Screen native` or a `Sheet` it renders bare.
 */
export function ListItem({swipeActions, ...props}: ListItemProps) {
  const hosted = useNativeHost();
  const menued = !!swipeActions && swipeActions.length > 0;
  const row = (
    <WithRowMenu actions={swipeActions} onPress={props.onPress}>
      <ListItemRow {...props} onPress={menued ? undefined : props.onPress}/>
    </WithRowMenu>
  );
  return hosted ? row : <NativeHost>{row}</NativeHost>;
}

/**
 * Android uses the Material 3 Compose `ListItem` directly so the container
 * can be made transparent — the M3 default paints the Host palette's
 * `surface`, which reads as a grey panel over the app's screen background
 * (web/iOS rows are transparent) — and the selected fill when the row is
 * the current one. An `action` is a `TextButton` (a filled `Button` for the
 * `filled` variant) in the trailing slot, after any `trailing` content; a
 * `value` and a `badge` go before it. Without its own inset the row is a
 * plain `Row` instead: the M3 `ListItem`'s 16dp is baked in and no modifier
 * can take it back off, so it would double the inset its container already
 * drew. The `Row` carries no padding of its own either — its container hands
 * down a minimum height and centers the row within it, so padding would not
 * fill that height but add to it, standing the row taller than its siblings.
 *
 * A row that presses is `clickable`, or `selectable` while it is the current
 * one, which puts the state in its semantics for TalkBack. The name composed
 * from the slots has nowhere to go: `@expo/ui`'s Compose `semantics` takes
 * `contentType` alone, so TalkBack reads the row's texts as Compose merges
 * them.
 */
function ListItemRow({children, icon, iconTone = 'secondary', leading, value, badge, badgeColor, trailing, action, supporting, selected = false, inset = true, onPress, testID}: ListItemProps) {
  const badgeColors = useBadgeColors(badgeColor);
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const tint = useColor('tint');
  const destructive = useColor('destructive');
  const muted = useColor('tertiaryLabel');
  const toned = useColor(TONE_TOKEN[iconTone]);
  const selectedFill = useColor('backgroundSelected');
  const onAction = useColor(action?.role === 'destructive' ? 'onDestructive' : 'onTint');
  // A row that presses says it is the current one: Compose's `selectable` puts
  // the state in the row's semantics, which TalkBack reads as "Selected". Only
  // the current row carries it, as only the current one carries iOS's trait and
  // the web's `aria-current`: a `selectable` row that is not selected is read as
  // "Not selected", which a settings row is not. No role: each one announces a
  // control a row is not.
  const press = onPress ? (selected ? selectable(true, onPress) : clickable(onPress)) : undefined;
  const modifiers = [
    ...(press ? [press] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  const actionColor = action?.role === 'destructive' ? destructive : tint;
  const filled = action?.variant === 'filled';
  // The filled control carries the accent, so its label takes the contrast.
  const ActionButton = filled ? Button : TextButton;
  const inactive = !!action?.disabled || !!action?.loading;
  const actionTextColor = action?.disabled ? muted : filled ? onAction : actionColor;
  const drawable = drawableOf(icon);
  const leadingContent = drawable ? (
    <>
      <Icon source={drawable} size={ROW_ICON} tint={toned}/>
      {leading}
    </>
  ) : leading;
  const marks = value != null || badge ? (
    <>
      {value != null ? <Text color={subtle} style={{fontSize: 14}}>{value}</Text> : null}
      {badge ? <Badge count={typeof badge === 'number' ? badge : undefined} dot={badge === true} {...badgeColors}/> : null}
    </>
  ) : null;
  const trailingContent = marks || action ? (
    <Row verticalAlignment="center" horizontalArrangement={{spacedBy: 8}}>
      {marks}
      {trailing}
      {action ? (
        <ActionButton
          onClick={inactive ? undefined : action.onPress}
          enabled={!inactive}
          colors={filled ? {containerColor: actionColor, contentColor: onAction} : {contentColor: actionColor}}
          shape={filled ? ROUNDED : undefined}
          contentPadding={filled ? androidContentPadding('small') : undefined}
          modifiers={[wrapContentWidth('end'), wrapContentHeight('centerVertically')]}>
          {action.loading ? (
            <>
              <CircularProgressIndicator color={actionTextColor} trackColor={TRANSPARENT} strokeWidth={2} modifiers={[size(ACTION_SPINNER, ACTION_SPINNER)]}/>
              <Spacer modifiers={[width(8)]}/>
            </>
          ) : null}
          <Text color={actionTextColor}>{action.label}</Text>
        </ActionButton>
      ) : null}
    </Row>
  ) : trailing;
  const headline = wrapText(children, label);
  const supportingContent = supporting != null ? (
    typeof supporting === 'string' || typeof supporting === 'number' ? (
      <Text color={subtle} style={{fontSize: 14}}>{supporting}</Text>
    ) : (
      supporting
    )
  ) : null;

  if (!inset) {
    return (
      <Row
        verticalAlignment="center"
        horizontalArrangement={{spacedBy: 12}}
        modifiers={[fillMaxWidth(), ...(selected ? [background(selectedFill)] : []), ...modifiers]}>
        {leadingContent}
        <Column verticalArrangement={{spacedBy: 2}} modifiers={[weight(1)]}>
          {headline}
          {supportingContent}
        </Column>
        {trailingContent}
      </Row>
    );
  }

  return (
    <ComposeListItem colors={{containerColor: selected ? selectedFill : TRANSPARENT}} modifiers={modifiers}>
      <ComposeListItem.HeadlineContent>
        {headline}
      </ComposeListItem.HeadlineContent>
      {leadingContent != null ? (
        <ComposeListItem.LeadingContent>{leadingContent}</ComposeListItem.LeadingContent>
      ) : null}
      {supportingContent != null ? (
        <ComposeListItem.SupportingContent>{supportingContent}</ComposeListItem.SupportingContent>
      ) : null}
      {trailingContent != null ? (
        <ComposeListItem.TrailingContent>{trailingContent}</ComposeListItem.TrailingContent>
      ) : null}
    </ComposeListItem>
  );
}

// Compose slots can't render raw strings — they need a Text composable.
function wrapText(node: ReactNode, color: string): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return <Text color={color}>{node}</Text>;
  }
  return node;
}

export type {ListItemProps} from './types';
