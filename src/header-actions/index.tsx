import type {PropsWithChildren} from 'react';
import {Row} from '@expo/ui';
import {HeaderHost, useInHeader} from '../header/shared';
import {HeaderSlot} from '../header/slot';
import {spacing} from '../theme';

/**
 * Space between the actions. Web's icon buttons have padding but not enough
 * of it: in the tab bar a `small` icon-only button is a 30px box around an
 * 18px glyph, so two abutting leave 12px between the glyphs and read as one
 * control.
 */
const GAP = spacing.two;

export interface HeaderActionsProps extends PropsWithChildren {
  /** Identifier used to locate the row in end-to-end tests. */
  testID?: string;
}

/**
 * More than one control in a stack header's trailing slot: a row of
 * `HeaderAction`s and `HeaderMenu`s, spaced the way the platform spaces the
 * actions in its own header, and sent there together from the screen's
 * content (see `HeaderAction` for where a header control goes).
 *
 * On iOS and Android the row is the platform's own: the actions and menus
 * inside it become the bar's items, in the order given, spaced by the bar,
 * and the row itself draws nothing. `testID` has no item to go on there; the
 * accessible name of each control is its `label`.
 *
 * Drawn (on web, or in a header that holds views), the row is one host for
 * all of them: a header control mounts a host of its own when it has to, so
 * three side by side would be three hosts in one header; inside this row they
 * find they are already in one and mount none. On web there is no host at
 * all, and the row is the DOM's.
 */
export const HeaderActions = Object.assign(
  function HeaderActions(props: HeaderActionsProps) {
    const inHeader = useInHeader();
    if (!inHeader) return <HeaderSlot><HeaderActions {...props}/></HeaderSlot>;
    return (
      <HeaderHost>
        <Row alignment="center" spacing={GAP} testID={props.testID}>
          {props.children}
        </Row>
      </HeaderHost>
    );
  },
  // What the native slot reads this element as: its children, one after another.
  {item: 'actions' as const},
);
