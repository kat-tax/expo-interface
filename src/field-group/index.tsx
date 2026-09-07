import type {FieldGroupProps, FieldGroupSectionProps, FieldSectionFooterColor} from './types';
import {FieldGroup as Base} from '@expo/ui';
import {Text} from '@expo/ui/swift-ui';
import {font, foregroundStyle} from '@expo/ui/swift-ui/modifiers';
import {useColor} from '../theme';
import {baseSection, mapSections} from './shared';

/**
 * App `FieldGroup`: a scrollable container of grouped settings-style rows.
 * iOS (this file) uses `@expo/ui`'s SwiftUI `Form`, whose `Section` gains
 * the `footer` prop as the native section footer slot. Android
 * (`index.android.tsx`) keeps the Material 3 connected-list look with app
 * palette colors. Web (`index.web.tsx` + `field-group.css`) re-themes the
 * universal component via CSS instead of forking its layout.
 */

/** The section `footer` as SwiftUI text, in the footnote size and the token's color. */
function FooterText({color, children}: {color: FieldSectionFooterColor; children: string}) {
  const resolved = useColor(color);
  return <Text modifiers={[foregroundStyle({type: 'color', color: resolved}), font({size: 13})]}>{children}</Text>;
}

const renderFooter = (footer: string, color: FieldSectionFooterColor) => <FooterText color={color}>{footer}</FooterText>;

function Section(props: FieldGroupSectionProps) {
  return baseSection(props, renderFooter);
}

function FieldGroupBase({children, ...props}: FieldGroupProps) {
  return <Base {...props}>{mapSections(children, Section, renderFooter)}</Base>;
}

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader: Base.SectionHeader,
  SectionFooter: Base.SectionFooter,
});

export type {FieldGroupProps, FieldGroupSectionProps};
