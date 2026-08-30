import type {ReactNode} from 'react';
import type {ListItemProps} from './types';
import {ListItem as ComposeListItem, Text} from '@expo/ui/jetpack-compose';
import {clickable, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android uses the Material 3 Compose `ListItem` directly so the container
 * can be made transparent — the M3 default paints the Host palette's
 * `surface`, which reads as a grey panel over the app's screen background
 * (web/iOS rows are transparent).
 */
export function ListItem({children, leading, trailing, supporting, onPress, testID}: ListItemProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const modifiers = [
    ...(onPress ? [clickable(onPress)] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
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
      {trailing != null ? (
        <ComposeListItem.TrailingContent>{trailing}</ComposeListItem.TrailingContent>
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
