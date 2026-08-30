import type {IconToken} from '@/ui/icons';

/**
 * Cross-platform button.
 *
 * Bridges the SwiftUI `Button` on iOS, the Jetpack Compose Material 3 buttons on
 * Android, and the HTML `<button>` element on web. The prop surface is the
 * intersection of what every platform supports, so the same component renders a
 * native-feeling button everywhere.
 *
 * Variants map to each platform's closest native equivalent:
 *
 * | variant    | iOS `buttonStyle`   | Android component     | web              |
 * | ---------- | ------------------- | --------------------- | ---------------- |
 * | `filled`   | `borderedProminent` | `Button`              | solid fill       |
 * | `outlined` | `bordered`          | `OutlinedButton`      | border, no fill  |
 * | `text`     | `plain`             | `TextButton`          | text only        |
 */
export type ButtonVariant = 'filled' | 'outlined' | 'text';

/**
 * Semantic role of the button. `destructive` renders the button in a danger
 * color (SwiftUI button role, Material error color, web danger styling).
 */
export type ButtonRole = 'default' | 'destructive';

/** Control size of the button. */
export type ButtonSize = 'small' | 'medium' | 'large';

/** Border shape of the button. */
export type ButtonShape = 'rounded' | 'pill' | 'circle';

export interface ButtonProps {
  /**
   * Text shown inside the button. Required for accessibility even when
   * `hideLabel` is true (icon-only mode).
   */
  label: string;
  /** Called when the button is pressed. */
  onPress?: () => void;
  /**
   * Visual emphasis of the button.
   * @default 'filled'
   */
  variant?: ButtonVariant;
  /**
   * Semantic role of the button.
   * @default 'default'
   */
  role?: ButtonRole;
  /** Accent color (tint) for the button. Defaults to the platform/theme tint. */
  color?: string;
  /**
   * Control size of the button.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * Border shape of the button. When omitted, each platform uses its default.
   */
  shape?: ButtonShape;
  /** Leading icon. Also used as the sole icon when `hideLabel` is true. */
  prefixIcon?: IconToken;
  /** Trailing icon. Ignored when `hideLabel` is true. */
  suffixIcon?: IconToken;
  /** Show only the prefix icon; `label` is kept for accessibility. */
  hideLabel?: boolean;
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}
