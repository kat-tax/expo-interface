import type {ReactNode} from 'react';
import type {ListItemProps} from './types';
import {ListItem as ComposeListItem, Row, Text, TextButton} from '@expo/ui/jetpack-compose';
import {clickable, testID as testIDModifier, wrapContentHeight, wrapContentWidth} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android uses the Material 3 Compose `ListItem` directly so the container
 * can be made transparent — the M3 default paints the Host palette's
 * `surface`, which reads as a grey panel over the app's screen background
 * (web/iOS rows are transparent). An `action` is a `TextButton` in the
 * trailing slot, after any `trailing` content.
 */
export function ListItem({children, leading, trailing, action, supporting, onPress, testID}: ListItemProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const tint = useColor('tint');
  const destructive = useColor('destructive');
  const muted = useColor('tertiaryLabel');
  const modifiers = [
    ...(onPress ? [clickable(onPress)] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  const actionColor = action?.role === 'destructive' ? destructive : tint;
  const trailingContent = action ? (
    <Row verticalAlignment="center" horizontalArrangement={{spacedBy: 8}}>
      {trailing}
      <TextButton
        onClick={action.disabled ? undefined : action.onPress}
        enabled={!action.disabled}
        colors={{contentColor: actionColor}}
        modifiers={[wrapContentWidth('end'), wrapContentHeight('centerVertically')]}>
        <Text color={action.disabled ? muted : actionColor}>{action.label}</Text>
      </TextButton>
    </Row>
  ) : trailing;
  return (
    <ComposeListItem colors={{containerColor: '#00000000'}} modifiers={modifiers}>
      <ComposeListItem.HeadlineContent>
        {wrapText(children, label)}
      </ComposeListItem.HeadlineContent>
      {leading != null ? (
        <ComposeListItem.LeadingContent>{leading}</ComposeListItem.LeadingContent>
      ) : null}
      {supporting != null ? (
        <ComposeListItem.SupportingContent>
          {typeof supporting === 'string' || typeof supporting === 'number' ? (
            <Text color={subtle} style={{fontSize: 14}}>{supporting}</Text>
          ) : (
            supporting
          )}
        </ComposeListItem.SupportingContent>
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
