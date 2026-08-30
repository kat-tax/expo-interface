import './field-group.css';
import {FieldGroup as BaseFieldGroup, type FieldGroupProps} from '@expo/ui';

/**
 * Web hook for `field-group.css`. Clears the universal component's hardcoded
 * scroll background so the wrapper supplies the app palette; section cards are
 * recolored in CSS (light mode only — dark matches @expo/ui).
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
