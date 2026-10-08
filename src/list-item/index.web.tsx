import './list-item.css';
import type {ListItemProps} from './types';
import {ROW_ICON, WithRowMenu, rowLabel, useBadgeColors} from './shared';
import {Badge} from '../badge';
import {Button} from '../button';
import {Icon} from '../symbol';

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
 * Web draws the row itself rather than through the universal `@expo/ui`
 * `ListItem`: that one paints its text from `prefers-color-scheme`, which
 * disagrees with a forced scheme, and it offers no place for an `action` —
 * the action's `<button>` has to sit beside the row's own control rather
 * than inside it, since nested buttons are not valid HTML and a click on the
 * action would also press the row. A selected row carries `aria-current`,
 * which is what the kit's menus say of their current entry too.
 */
function ListItemRow({children, icon, iconTone = 'secondary', leading, value, badge, badgeColor, trailing, action, supporting, selected = false, inset = true, onPress, testID}: ListItemProps) {
  const badgeColors = useBadgeColors(badgeColor);
  const rowClass = ['ui-list-item', !inset && 'ui-list-item--flush', selected && 'ui-list-item--selected'].filter(Boolean).join(' ');
  const label = rowLabel({children, supporting, value, badge});
  const current = selected ? ('true' as const) : undefined;
  const marks = value != null || badge ? (
    <>
      {value != null ? <span className="ui-list-item__value">{value}</span> : null}
      {badge ? <Badge count={typeof badge === 'number' ? badge : undefined} dot={badge === true} {...badgeColors}/> : null}
    </>
  ) : null;
  const content = (
    <>
      {icon || leading != null ? (
        <span className="ui-list-item__slot">
          {icon ? <Icon icon={icon} size={ROW_ICON} tone={iconTone}/> : null}
          {leading}
        </span>
      ) : null}
      <span className="ui-list-item__main">
        <span className="ui-list-item__headline">{children}</span>
        {supporting != null ? (
          typeof supporting === 'string' || typeof supporting === 'number'
            ? <span className="ui-list-item__supporting">{supporting}</span>
            : supporting
        ) : null}
      </span>
      {marks || trailing != null ? (
        <span className="ui-list-item__slot">
          {marks}
          {trailing}
        </span>
      ) : null}
    </>
  );
  // Without an action the row is the control: a `<button>` when it presses.
  if (!action) {
    return onPress ? (
      <button type="button" className={rowClass} aria-label={label} aria-current={current} data-testid={testID} onClick={onPress}>{content}</button>
    ) : (
      <div className={rowClass} aria-label={label} aria-current={current} data-testid={testID}>{content}</div>
    );
  }
  const filled = action.variant === 'filled';
  return (
    <div className={rowClass} aria-current={current} data-testid={testID}>
      {onPress ? (
        <button type="button" className="ui-list-item__row ui-list-item__row--pressable" aria-label={label} onClick={onPress}>{content}</button>
      ) : (
        <div className="ui-list-item__row" aria-label={label}>{content}</div>
      )}
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
    </div>
  );
}

export type {ListItemProps} from './types';
