import type {SearchFieldProps} from '../search-field/types';
import type {DrawnSearchPlacement, HeaderSearchIntegration, HeaderSearchPlaceholder, HeaderSearchPlacement, HeaderSearchState} from './types';
import {createContext} from 'react';
import {icon} from '../icons';

/** The magnifier, where the kit draws the search's own button. */
export const SEARCH_ICON = icon({ios: 'magnifyingglass', android: 'search', web: 'search'});

/** What the inline field takes: the search field's props, and the placeholder for a narrow web bar. */
export interface InlineFieldProps extends SearchFieldProps {
  /** Shown instead of `placeholder` while the web bar is too narrow for its labels. */
  shortPlaceholder?: string;
}

/** The search's state everywhere but a narrow web bar. */
export const FULL: HeaderSearchState = {size: 'full'};

/** A narrow web bar's inline field, at its floor. */
export const SHORT: HeaderSearchState = {size: 'short'};

/** The placeholder to show for a state: the string as it is, or the function's answer. */
export function placeholderFor(placeholder: HeaderSearchPlaceholder | undefined, state: HeaderSearchState = FULL): string | undefined {
  return typeof placeholder === 'function' ? placeholder(state) : placeholder;
}

/** A field in the bar beside the title: a desktop search box's width. */
export const INLINE_WIDTH = 240;

/**
 * The short field a web `inline` search shrinks to with its row: the
 * magnifier and a few words of the placeholder. Below this the row is too
 * narrow for what it holds, and it is the bar's labels that go, not the
 * search.
 */
export const INLINE_MIN_WIDTH = 120;

/**
 * The placement in UIKit's words (`UINavigationItem.SearchBarPlacement`, as
 * react-native-screens names them). `integrated` is one of three looks;
 * `action` is the bar's own search button, kept out of the bottom toolbar
 * (`allowToolbarIntegration` off) so it stays among the header's items. On
 * iOS 16 to 18 UIKit draws every integrated placement as `inline`.
 */
export function iosPlacement(placement: HeaderSearchPlacement, integration: HeaderSearchIntegration): 'automatic' | 'stacked' | 'inline' | 'integrated' | 'integratedButton' | 'integratedCentered' {
  switch (placement) {
    case 'integrated':
      return integration === 'button' ? 'integratedButton' : integration === 'centered' ? 'integratedCentered' : 'integrated';
    case 'action':
      return 'integratedButton';
    case 'automatic':
    case 'stacked':
    case 'inline':
      return placement;
  }
}

/**
 * What a drawn header draws for a placement. `automatic` is `inline` at
 * every width: the field beside the title shrinks with the row, so nothing
 * stacks unless asked.
 */
export function drawnPlacement(placement: Exclude<HeaderSearchPlacement, 'integrated'>): DrawnSearchPlacement {
  return placement === 'automatic' ? 'inline' : placement;
}

/**
 * What a drawn header tells the search element it holds: the placement it
 * resolved, and where to say that an `action` has expanded or collapsed, so
 * the header can give the field the row.
 */
export interface DrawnSearchSite {
  placement: DrawnSearchPlacement;
  setOpen(open: boolean): void;
}

export const DrawnSearchContext = createContext<DrawnSearchSite | null>(null);
