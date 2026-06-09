/**
 * App `FieldGroup`: a scrollable container of grouped settings-style rows.
 * Web/iOS use `@expo/ui`'s universal component as-is (SwiftUI `Form` on iOS,
 * iOS-Settings-style cards on web). Android has a custom implementation
 * (`index.android.tsx`) that keeps the Material 3 connected-list look but
 * colors rows from the app palette for web parity.
 */
export {FieldGroup, type FieldGroupProps} from '@expo/ui';
