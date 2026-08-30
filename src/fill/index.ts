import type {UniversalBaseProps} from '@expo/ui';

/**
 * Modifiers that make a universal `Column`/`Row` span its parent's full width.
 *
 * On web the universal layout primitives already stretch to fill the cross-axis,
 * so no modifier is needed. On Android (Compose) and iOS (SwiftUI) the
 * containers wrap their content by default, so a platform modifier is required.
 */
export const fillWidth: NonNullable<UniversalBaseProps['modifiers']> = [];
