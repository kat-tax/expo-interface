import type {ReactNode} from 'react';

/** A row of the screen's own under its header (see `HeaderAccessory`). */
export interface HeaderAccessoryProps {
  /** The row: a strip of tabs, a filter bar, a breadcrumb. It lays out its own height. */
  children: ReactNode;
}
