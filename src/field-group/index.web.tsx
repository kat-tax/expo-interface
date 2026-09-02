import './field-group.css';
import {FieldGroup as BaseFieldGroup, type FieldGroupProps} from '@expo/ui';

/**
 * Web hook for `field-group.css`. Clears the universal component's hardcoded
 * scroll background so the wrapper supplies the app palette; section cards
 * and row dividers are recolored to the kit tokens in the CSS.
 */
function FieldGroup({style, ...props}: FieldGroupProps) {
  return (
    <div className="field-group">
      <BaseFieldGroup
        {...props}
        style={{...style, backgroundColor: 'transparent'}}
      />
    </div>
  );
}

FieldGroup.Section = BaseFieldGroup.Section;
FieldGroup.SectionHeader = BaseFieldGroup.SectionHeader;
FieldGroup.SectionFooter = BaseFieldGroup.SectionFooter;

export {FieldGroup, type FieldGroupProps};
