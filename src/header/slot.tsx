import type {PropsWithChildren} from 'react';
import {useMemo} from 'react';
import {Platform} from 'react-native';
import {Stack} from '../router/stack';
import {InHeaderContext} from './shared';
import {ToolbarSlot} from './toolbar';

/** iOS and Android: the header is the native stack's own bar, which takes items, not views. */
const NATIVE_BAR = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Sends a header control rendered in a screen's content to the screen's
 * header, drawing nothing in place: on iOS and Android it becomes one of the
 * bar's own items (`ToolbarSlot`); on web and Windows it goes to the route's
 * `headerRight`, which the drawn header picks up (`ConstrainedStackHeader`
 * on web, the kit's own stack on Windows). The route keeps its other
 * options: a `Stack.Screen` in a screen merges what it is given with what is
 * there. A control inside a header already draws itself and never comes
 * here (`useInHeader`).
 *
 * One file for every platform on purpose: a `slot.native.tsx` would win on
 * Windows too, where the header is drawn.
 */
export function HeaderSlot({children}: PropsWithChildren) {
  if (NATIVE_BAR) return <ToolbarSlot>{children}</ToolbarSlot>;
  return <DrawnSlot>{children}</DrawnSlot>;
}

function DrawnSlot({children}: PropsWithChildren) {
  const options = useMemo(() => ({
    headerRight: () => <InHeaderContext.Provider value={true}>{children}</InHeaderContext.Provider>,
  }), [children]);
  return <Stack.Screen options={options}/>;
}
