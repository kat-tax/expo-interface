import './list-item.css';
import type {ListItemProps} from './types';
import {ListItem as UIListItem} from '@expo/ui';
import {Button} from '../button';

/**
 * Web renders the universal `@expo/ui` `ListItem` (a React Native row)
 * through explicit slot props. With an `action` the row is drawn here
 * instead, so the action's `<button>` sits beside the row's own (a `<button>`
 * when the row has an `onPress`, a `<div>` otherwise) rather than inside it:
 * nested buttons are not valid HTML, and a click on the action would also
 * press the row.
 */
export function ListItem({children, leading, trailing, action, supporting, onPress, testID}: ListItemProps) {
  if (!action) {
    return (
      <UIListItem
        onPress={onPress}
        leading={leading}
        trailing={trailing}
        supportingText={supporting}
        testID={testID}>
        {children}
      </UIListItem>
    );
  }
  const content = (
    <>
      {leading != null ? <span className="ui-list-item__slot">{leading}</span> : null}
      <span className="ui-list-item__main">
        <span className="ui-list-item__headline">{children}</span>
        {supporting != null ? (
          typeof supporting === 'string' || typeof supporting === 'number'
            ? <span className="ui-list-item__supporting">{supporting}</span>
            : supporting
        ) : null}
      </span>
      {trailing != null ? <span className="ui-list-item__slot">{trailing}</span> : null}
    </>
  );
  return (
    <div className="ui-list-item" data-testid={testID}>
      {onPress ? (
        <button type="button" className="ui-list-item__row ui-list-item__row--pressable" onClick={onPress}>{content}</button>
      ) : (
        <div className="ui-list-item__row">{content}</div>
      )}
      <Button
        label={action.label}
        variant="text"
        size="small"
        role={action.role === 'destructive' ? 'destructive' : 'default'}
        disabled={action.disabled}
        onPress={action.onPress}
      />
    </div>
  );
}

export type {ListItemProps} from './types';
