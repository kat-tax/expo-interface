import './field-group.css';
import type {FieldGroupProps, FieldGroupSectionProps, FieldSectionFooterColor} from './types';
import {FieldGroup as Base} from '@expo/ui';
import {Footnote} from '../typography';
import {baseSection, mapSections} from './shared';

const renderFooter = (footer: string, color: FieldSectionFooterColor) => <Footnote color={color}>{footer}</Footnote>;

/**
 * Web: the universal `FieldGroup.Section` with the `footer` prop as its
 * footer slot, drawn as the kit's `Footnote`.
 */
function Section(props: FieldGroupSectionProps) {
  return baseSection(props, renderFooter);
}

/**
 * Web hook for `field-group.css`. Clears the universal component's hardcoded
 * scroll background so the wrapper supplies the app palette; section cards
 * and row dividers are recolored to the kit tokens in the CSS.
 */
function FieldGroupBase({style, children, ...props}: FieldGroupProps) {
  return (
    <div className="field-group">
      <Base
        {...props}
        style={{...style, backgroundColor: 'transparent'}}>
        {mapSections(children, Section, renderFooter)}
      </Base>
    </div>
  );
}

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader: Base.SectionHeader,
  SectionFooter: Base.SectionFooter,
});

export type {FieldGroupProps, FieldGroupSectionProps};
