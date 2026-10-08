import type {ReactNode} from 'react';

/** A row of the screen's own under its header (see `HeaderAccessory`). */
export interface HeaderAccessoryProps {
  /**
   * The row: a strip of tabs, a filter bar, a breadcrumb. It lays out its
   * own height. A `TabView` here takes `fill="none"`, so the header's
   * material shows through the strip rather than the strip's own fill, and
   * no `children`, so it is the tabs alone and the screen's content is the
   * page.
   */
  children: ReactNode;
}
