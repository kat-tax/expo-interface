import type {ReactNode} from 'react';
import type {DrawnSearchPlacement, HeaderSearchSlot} from './types';
import {useMemo, useState} from 'react';
import {InHeaderContext} from '../header/shared';
import {DrawnSearchContext, drawnPlacement} from './shared';

/** What a drawn header draws for a screen's search, and where. */
export interface SearchSite {
  /** The placement resolved, or `null` without a search. */
  placement: DrawnSearchPlacement | null;
  /** The search for the header's row: the field beside the title, or the magnifier. */
  inRow: ReactNode;
  /** The search for the row under the header. */
  stacked: ReactNode;
  /** An `action` has expanded: the row is the field's, and the header lets go of its title. */
  open: boolean;
}

/**
 * Resolves a screen's search for the header that draws it: `automatic` by
 * whether the header is too narrow for a field beside its title, and the
 * element wrapped in what it needs to draw itself there, the header context
 * and the site it was given.
 */
export function useSearchSite(slot: HeaderSearchSlot | undefined, narrow: boolean): SearchSite {
  const [open, setOpen] = useState(false);
  const placement = slot ? drawnPlacement(slot.placement, narrow) : null;
  const site = useMemo(() => (placement ? {placement, setOpen} : null), [placement]);
  const node = slot && site ? (
    <DrawnSearchContext.Provider value={site}>
      <InHeaderContext.Provider value={true}>{slot.node}</InHeaderContext.Provider>
    </DrawnSearchContext.Provider>
  ) : null;
  return {
    placement,
    inRow: placement === 'stacked' ? null : node,
    stacked: placement === 'stacked' ? node : null,
    open: placement === 'action' && open,
  };
}
