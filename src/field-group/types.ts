import type {FieldGroupProps, FieldSectionProps} from '@expo/ui';

/** Color of a section's `footer` text. */
export type FieldSectionFooterColor = 'secondaryLabel' | 'destructive';

/**
 * Props of `FieldGroup.Section`: `@expo/ui`'s, plus a plain-text footer.
 * SwiftUI's `Section` has a footer, the web draws a caption under the group
 * and Android under the rows, so a note under a section (what a setting
 * does, why it failed) is one prop on every platform.
 */
export interface FieldGroupSectionProps extends FieldSectionProps {
  /**
   * A note under the rows, in the secondary color. Ignored when a
   * `<FieldGroup.SectionFooter>` child is given.
   */
  footer?: string;
  /**
   * Color of the footer text: `destructive` for an error.
   * @default 'secondaryLabel'
   */
  footerColor?: FieldSectionFooterColor;
}

export type {FieldGroupProps};
