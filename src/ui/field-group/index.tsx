/**
 * App `FieldGroup`: a scrollable container of grouped settings-style rows.
 * iOS uses `@expo/ui`'s SwiftUI `Form`. Android (`index.android.tsx`) keeps
 * the Material 3 connected-list look with app palette colors. Web
 * (`index.web.tsx` + `field-group.css`) re-themes the universal component via
 * CSS instead of forking its layout.
 */
export {FieldGroup, type FieldGroupProps} from '@expo/ui';
