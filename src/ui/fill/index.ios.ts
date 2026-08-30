import type {UniversalBaseProps} from '@expo/ui';
import {frame} from '@expo/ui/swift-ui/modifiers';

// SwiftUI fills width with `.frame(maxWidth: .infinity)`, but `Infinity` can't
// survive JSON serialization to the native modifier (it becomes null, a no-op).
// A large finite max width fills the available space inside the constrained Host.
const FILL = 100000;

export const fillWidth: NonNullable<UniversalBaseProps['modifiers']> = [frame({maxWidth: FILL})];
