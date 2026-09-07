import type {ComponentType, ReactElement, ReactNode} from 'react';
import type {FieldGroupSectionProps, FieldSectionFooterColor} from './types';
import {Children, Fragment, isValidElement} from 'react';
import {FieldGroup as Base} from '@expo/ui';

/** Renders the `footer` prop's text in the platform's own text control. */
export type FooterRenderer = (footer: string, color: FieldSectionFooterColor) => ReactNode;

/** Whether the section's children already carry a `SectionFooter` slot. */
export function hasFooterSlot(children: ReactNode): boolean {
  return Children.toArray(children).some(child => isValidElement(child) && child.type === Base.SectionFooter);
}

/**
 * The universal `FieldGroup.Section` with the `footer` prop turned into a
 * `SectionFooter` slot (unless the children carry one already).
 */
export function baseSection(
  {footer, footerColor = 'secondaryLabel', children, ...props}: FieldGroupSectionProps,
  renderFooter: FooterRenderer,
): ReactElement {
  const note = footer != null && !hasFooterSlot(children) ? (
    <Base.SectionFooter>{renderFooter(footer, footerColor)}</Base.SectionFooter>
  ) : null;
  return (
    <Base.Section {...props}>
      {children}
      {note}
    </Base.Section>
  );
}

/**
 * The universal `FieldGroup` groups loose rows into implicit sections by
 * checking each child's type against its own `Section`, so a kit `Section`
 * wrapping it would be grouped as a row. The kit sections are therefore
 * replaced by the universal ones (with the footer slot) before the children
 * reach the group; fragments are walked like the group walks them.
 */
export function mapSections(children: ReactNode, Section: ComponentType<FieldGroupSectionProps>, renderFooter: FooterRenderer): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement(child)) return child;
    if (child.type === Section) return baseSection(child.props as FieldGroupSectionProps, renderFooter);
    if (child.type === Fragment) {
      return <Fragment>{mapSections((child.props as {children?: ReactNode}).children, Section, renderFooter)}</Fragment>;
    }
    return child;
  });
}
