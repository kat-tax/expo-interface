import type {UniversalBaseProps} from '@expo/ui';
import {fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';

export const fillWidth: NonNullable<UniversalBaseProps['modifiers']> = [fillMaxWidth()];
