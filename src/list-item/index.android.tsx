import type {ReactNode} from 'react';
import type {ListItemProps} from './types';
import {Button, Column, ListItem as ComposeListItem, Row, Shape, Text, TextButton} from '@expo/ui/jetpack-compose';
import {clickable, fillMaxWidth, padding, testID as testIDModifier, weight, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {androidContentPadding} from '../button/shared';
import {useColor} from '../theme';

/** The `rounded` button shape, as the kit's own `Button` draws it. */
const ROUNDED = Shape.RoundedCorner({cornerRadii: {topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12}});

/**
 * Android uses the Material 3 Compose `ListItem` directly so the container
 * can be made transparent — the M3 default paints the Host palette's
 * `surface`, which reads as a grey panel over the app's screen background
 * (web/iOS rows are transparent). An `action` is a `TextButton` (a filled
 * `Button` for the `filled` variant) in the trailing slot, after any
 * `trailing` content. Without its own inset the row is a plain `Row`
 * instead: the M3 `ListItem`'s 16dp is baked in and no modifier can take it
 * back off, so it would double the inset its container already drew.
 */
export function ListItem({children, leading, trailing, action, supporting, inset = true, onPress, testID}: ListItemProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const tint = useColor('tint');
  const destructive = useColor('destructive');
  const muted = useColor('tertiaryLabel');
  const onAction = useColor(action?.role === 'destructive' ? 'onDestructive' : 'onTint');
  const modifiers = [
    ...(onPress ? [clickable(onPress)] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  const actionColor = action?.role === 'destructive' ? destructive : tint;
  const filled = action?.variant === 'filled';
  // The filled control carries the accent, so its label takes the contrast.
  const ActionButton = filled ? Button : TextButton;
  const actionTextColor = action?.disabled ? muted : filled ? onAction : actionColor;
  const trailingContent = action ? (
    <Row verticalAlignment="center" horizontalArrangement={{spacedBy: 8}}>
      {trailing}
      <ActionButton
        onClick={action.disabled ? undefined : action.onPress}
        enabled={!action.disabled}
        colors={filled ? {containerColor: actionColor, contentColor: onAction} : {contentColor: actionColor}}
        shape={filled ? ROUNDED : undefined}
        contentPadding={filled ? androidContentPadding('small') : undefined}
        modifiers={[wrapContentWidth('end'), wrapContentHeight('centerVertically')]}>
        <Text color={actionTextColor}>{action.label}</Text>
      </ActionButton>
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
        modifiers={[fillMaxWidth(), padding(0, 8, 0, 8), ...modifiers]}>
        {leading}
        <Column verticalArrangement={{spacedBy: 2}} modifiers={[weight(1)]}>
          {headline}
          {supportingContent}
        </Column>
        {trailingContent}
      </Row>
    );
  }

  return (
    <ComposeListItem colors={{containerColor: '#00000000'}} modifiers={modifiers}>
      <ComposeListItem.HeadlineContent>
        {headline}
      </ComposeListItem.HeadlineContent>
      {leading != null ? (
        <ComposeListItem.LeadingContent>{leading}</ComposeListItem.LeadingContent>
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
