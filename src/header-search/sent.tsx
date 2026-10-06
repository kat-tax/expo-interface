import type {ComponentProps, PropsWithChildren} from 'react';
import type {HeaderSearchProps, HeaderSearchSlot} from './types';
import {useMemo} from 'react';
import {useInHeader} from '../header/shared';
import {Stack} from '../router/stack';
import {ScreenBar} from '../screen/bars';
import {SearchBottomBar, SiteSearch} from './drawn';

/**
 * Web and Windows: the header is drawn by the kit, so the search is too,
 * with `SearchField`'s box at the header's metrics. Rendered in the screen's
 * content like the other header controls, it goes to the route's
 * `headerSearch` option, which the drawn header picks up and places by the
 * placement asked for: under the title (`stacked`), in the row beside it
 * (`inline`), or as a magnifier among the actions that expands across the
 * row (`action`); `automatic` is decided by the header's width. On web a
 * `Tabs` bar that folds the header takes the search as it takes the rest of
 * it. `integrated` is a bottom `Toolbar` with the field, the `Screen`'s when
 * the search is rendered inside one. Rendered inside a header already, it
 * draws itself in place.
 *
 * One implementation for web and Windows, as the slot is: the two draw their
 * headers the same way. Their index files name it, since a Windows resolver
 * without a `.windows` file falls through to the iOS one.
 */
export const HeaderSearch = Object.assign(
  function HeaderSearch(props: HeaderSearchProps) {
    const inHeader = useInHeader();
    const {placement = 'automatic'} = props;
    if (placement === 'integrated') return <ScreenBar edge="bottom"><SearchBottomBar {...props}/></ScreenBar>;
    if (inHeader) return <SiteSearch {...props} placement={placement}/>;
    return (
      <SearchSlot placement={placement}>
        <SiteSearch {...props} placement={placement}/>
      </SearchSlot>
    );
  },
  // What the native slot reads this element as: not an item of the bar, but the bar's search.
  {item: 'search' as const},
);

/**
 * Sends the search to the route's header through its options, the way the
 * other header controls reach `headerRight`: a `Stack.Screen` in a screen
 * merges what it is given with what is there, so a `HeaderActions` beside
 * the search keeps its items.
 */
function SearchSlot({placement, children}: PropsWithChildren<{placement: HeaderSearchSlot['placement']}>) {
  // An option of the kit's own, which the stack's types do not know and the drawn header reads.
  const options = useMemo(() => ({headerSearch: {placement, node: children}}) as unknown as ScreenOptions, [placement, children]);
  return <Stack.Screen options={options}/>;
}

type ScreenOptions = ComponentProps<typeof Stack.Screen>['options'];

export type {HeaderSearchCommands, HeaderSearchInput, HeaderSearchIntegration, HeaderSearchPlacement, HeaderSearchProps} from './types';
