import type {ComponentProps} from 'react';
import type {HeaderAccessoryProps} from './types';
import {useMemo} from 'react';
import {Stack} from '../router/stack';

/**
 * Web and Windows: the header is drawn by the kit, so the row is too.
 * Rendered in the screen's content, it goes to the route's `headerAccessory`
 * option, as `HeaderSearch` goes to `headerSearch`: the drawn header puts it
 * under its row, and a web `Tabs` bar that folds the header puts it under
 * the bar, in the bar's material, and counts its height in
 * `useTabBarInset()`.
 */
export function HeaderAccessory({children}: HeaderAccessoryProps) {
  // An option of the kit's own, which the stack's types do not know and the drawn header reads.
  const options = useMemo(() => ({headerAccessory: children}) as unknown as ScreenOptions, [children]);
  return <Stack.Screen options={options}/>;
}

type ScreenOptions = ComponentProps<typeof Stack.Screen>['options'];
