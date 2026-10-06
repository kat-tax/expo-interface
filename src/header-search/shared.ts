import type {DrawnSearchPlacement, HeaderSearchIntegration, HeaderSearchPlacement} from './types';
import {createContext} from 'react';
import {icon} from '../icons';

/** The magnifier, where the kit draws the search's own button. */
export const SEARCH_ICON = icon({ios: 'magnifyingglass', android: 'search', web: 'search'});

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
 * What a drawn header draws for a placement. `automatic` is `stacked` where
 * the row is too narrow for a field beside the title and `inline` where it
 * is wide; Windows is always wide, as the issue's table has it.
 */
export function drawnPlacement(placement: Exclude<HeaderSearchPlacement, 'integrated'>, narrow: boolean): DrawnSearchPlacement {
  if (placement === 'automatic') return narrow ? 'stacked' : 'inline';
  return placement;
}

/** A web header row narrower than this has no room for a field beside its title. */
export const NARROW_HEADER = 600;

/**
 * Whether a window of this width is too narrow for a field beside the title.
 * A width of zero is no width at all: a static render, which has no window
 * to measure, and is drawn wide rather than stacked and then rearranged on
 * the first paint in a desktop window.
 */
export function isNarrow(width: number): boolean {
  return width > 0 && width < NARROW_HEADER;
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
