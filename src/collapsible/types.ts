import type {ReactNode} from 'react';

/**
 * Cross-platform disclosure: a tappable header that shows or hides content.
 *
 * Bridges the SwiftUI `DisclosureGroup` on iOS, the Jetpack Compose
 * expandable list item on Android (via `@expo/ui`'s universal `Collapsible`),
 * and the HTML `<details>` element on web. May be used controlled
 * (`expanded` + `onExpandedChange`) or uncontrolled (`defaultExpanded`).
 */
export interface CollapsibleProps {
  /** Text rendered in the tappable header. */
  label: string;
  /** Whether the content is shown (controlled). */
  expanded?: boolean;
  /** Initial state when uncontrolled. */
  defaultExpanded?: boolean;
  /** Called when the user toggles the header. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Content shown while expanded. Must be native (`@expo/ui`) content on iOS/Android. */
  children?: ReactNode;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}
