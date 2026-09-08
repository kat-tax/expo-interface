import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {Row} from '@expo/ui';
import {HeaderHost} from '../header/shared';
import {spacing} from '../theme';

/**
 * Space between the actions.
 *
 * None on Android: Material's icon buttons carry their own 48dp container. An
 * app that laid three of them out as three hosts measured 48.4dp and 48.0dp
 * centre to centre on a Pixel 7 Pro — exactly the app bar's action pitch, so
 * the toolbar between them was adding nothing, and neither does this row. A
 * gap would push them past it.
 *
 * iOS composes a plain button that is exactly its symbol, so the space between
 * two of them is the bar's to give. Web's icon buttons have padding but not
 * enough of it: in the tab bar a `small` icon-only button is a 30px box around
 * an 18px glyph, so two abutting leave 12px between the glyphs and read as one
 * control.
 */
const GAP = Platform.select({android: 0, ios: spacing.three, default: spacing.two});

export interface HeaderActionsProps extends PropsWithChildren {
  /** Identifier used to locate the row in end-to-end tests. */
  testID?: string;
}

/**
 * More than one control in a stack header's trailing slot, which takes a
 * single node: a row of `HeaderAction`s and `HeaderMenu`s, spaced the way each
 * platform spaces the actions in its own header.
 *
 * It is also the one host for all of them. A header control mounts a host of
 * its own when it has to (`@expo/ui` controls are native views, which a React
 * Native header cannot hold otherwise), so three of them side by side would be
 * three hosts in one header; inside this row they find they are already in one
 * and mount none. The row keeps the host's own requirement: a navigator above
 * it on Android, whose focus it rebuilds on.
 */
export function HeaderActions({children, testID}: HeaderActionsProps) {
  return (
    <HeaderHost>
      <Row alignment="center" spacing={GAP} testID={testID}>
        {children}
      </Row>
    </HeaderHost>
  );
}
