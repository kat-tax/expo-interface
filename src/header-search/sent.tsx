import type {PropsWithChildren} from 'react';
import type {HeaderSearchProps, HeaderSearchSlot} from './types';
import {useMemo} from 'react';
import {useHeaderOption} from '../header/option';
import {useInHeader} from '../header/shared';
import {ScreenBar} from '../screen/bars';
import {useClearOnUnmount} from './clear';
import {SearchBottomBar, SiteSearch} from './drawn';

/**
 * Web and Windows: the header is drawn by the kit, so the search is too.
 * Rendered in the screen's content like the other header controls, it goes
 * to the route's `headerSearch` option, which the drawn header picks up and
 * places by the placement asked for: under the title (`stacked`, with
 * `SearchField`'s box), in the row beside it (`inline`, which `automatic` is:
 * a frameless field on web, the `AutoSuggestBox` on Windows), or as a
 * magnifier among the actions that expands across the row (`action`). On web
 * a `Tabs` bar that folds the header takes the search as it takes the rest
 * of it, the inline field beside the logo. `integrated` is a bottom `Toolbar`
 * with the field, the `Screen`'s when the search is rendered inside one.
 * Rendered inside a header already, it draws itself in place.
 *
 * One implementation for web and Windows, as the slot is: the two draw their
 * headers the same way. Their index files name it, since a Windows resolver
 * without a `.windows` file falls through to the iOS one.
 */
export const HeaderSearch = Object.assign(
  function HeaderSearch(props: HeaderSearchProps) {
    const inHeader = useInHeader();
    useClearOnUnmount(props.onChangeText);
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
 * Sends the search to the route's header through its `headerSearch` option,
 * an option of the kit's own that the drawn header reads. Setting options
 * merges, so a `HeaderActions` beside the search keeps its items, and the
 * search comes off the route when the element goes: unmounted, or turned
 * `integrated`, which draws its own bar instead.
 */
function SearchSlot({placement, children}: PropsWithChildren<{placement: HeaderSearchSlot['placement']}>) {
  const slot = useMemo<HeaderSearchSlot>(() => ({placement, node: children}), [placement, children]);
  useHeaderOption('headerSearch', slot);
  return null;
}

export type {HeaderSearchCommands, HeaderSearchInput, HeaderSearchIntegration, HeaderSearchPlacement, HeaderSearchProps} from './types';
