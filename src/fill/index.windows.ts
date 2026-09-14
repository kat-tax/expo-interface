import type {UniversalBaseProps} from '@expo/ui';

/**
 * Windows: nothing. The universal layout primitives are React Native views
 * here, which stretch across a column on their own (`alignSelf: 'stretch'`
 * is the default), so no modifier is needed — as on web.
 */
export const fillWidth: NonNullable<UniversalBaseProps['modifiers']> = [];
