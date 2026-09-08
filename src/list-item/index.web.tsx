import './list-item.css';
import type {ListItemProps} from './types';
import {Button} from '../button';

/**
 * Web draws the row itself rather than through the universal `@expo/ui`
 * `ListItem`: that one paints its text from `prefers-color-scheme`, which
 * disagrees with a forced scheme, and it offers no place for an `action` —
 * the action's `<button>` has to sit beside the row's own control rather
 * than inside it, since nested buttons are not valid HTML and a click on the
 * action would also press the row.
 */
export function ListItem({children, leading, trailing, action, supporting, inset = true, onPress, testID}: ListItemProps) {
  const rowClass = inset ? 'ui-list-item' : 'ui-list-item ui-list-item--flush';
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
  // Without an action the row is the control: a `<button>` when it presses.
  if (!action) {
    return onPress ? (
      <button type="button" className={rowClass} data-testid={testID} onClick={onPress}>{content}</button>
    ) : (
      <div className={rowClass} data-testid={testID}>{content}</div>
    );
  }
  const filled = action.variant === 'filled';
  return (
    <div className={rowClass} data-testid={testID}>
      {onPress ? (
        <button type="button" className="ui-list-item__row ui-list-item__row--pressable" onClick={onPress}>{content}</button>
      ) : (
        <div className="ui-list-item__row">{content}</div>
      )}
      <Button
        label={action.label}
        variant={filled ? 'filled' : 'text'}
        shape={filled ? 'rounded' : undefined}
        size="small"
        role={action.role === 'destructive' ? 'destructive' : 'default'}
        disabled={action.disabled}
        onPress={action.onPress}
      />
    </div>
  );
}

export type {ListItemProps} from './types';
