import type {ReactNode} from 'react';
import type {ListItemProps} from '../list-item/types';
import {Children, cloneElement, isValidElement} from 'react';
import {ListItem} from '../list-item';

/**
 * A section draws each row's container, inset and minimum height itself, so
 * a kit `ListItem` among its children gives up its own inset — padded twice,
 * the row would sit further in than the ones beside it. A row that asks for
 * an inset explicitly keeps what it asked for.
 */
export function flushRow(child: ReactNode): ReactNode {
  return isValidElement<ListItemProps>(child) && child.type === ListItem && child.props.inset === undefined
    ? cloneElement(child, {inset: false})
    : child;
}

/** `flushRow` over a section's children. */
export function flushRows(children: ReactNode): ReactNode {
  return Children.map(children, flushRow);
}
