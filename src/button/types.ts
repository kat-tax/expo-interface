import type {IconToken} from '../icons';

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

/**
 * Control size of the button. `inline` is the bar size: no padding at all, so
 * the button is exactly its content — a tool in a toolbar or a header row,
 * where a padded button would set the bar's height.
 */
export type ButtonSize = 'inline' | 'small' | 'medium' | 'large';

/** Border shape of the button. */
export type ButtonShape = 'rounded' | 'pill' | 'circle';

/**
 * Color the `text` variant draws its label and icons in. `accent` is the
 * theme tint (a call to action); `label` is the primary text color, for
 * tools in a toolbar where the accent is kept for the one that is active.
 * Filled and outlined buttons ignore it. An explicit `color` wins.
 */
export type ButtonTone = 'accent' | 'label';

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
   * Color of the `text` variant's content.
   * @default 'accent'
   */
  tone?: ButtonTone;
  /**
   * Control size of the button.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * Border shape of the button. When omitted, each platform uses its default.
   */
  shape?: ButtonShape;
  /**
   * Size of the button's icons in points/dp. Defaults to the size that goes
   * with `size`; a header action's icon is larger than its label (24 on
   * Android, 22 on iOS), which is why it can be set on its own.
   */
  iconSize?: number;
  /** Leading icon. Also used as the sole icon when `hideLabel` is true. */
  prefixIcon?: IconToken;
  /** Trailing icon. Ignored when `hideLabel` is true. */
  suffixIcon?: IconToken;
  /** Show only the prefix icon; `label` is kept for accessibility. */
  hideLabel?: boolean;
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  /**
   * Stretch the button to its container's full width. By default the button
   * hugs its content, even when the parent would stretch it (a flex column on
   * web, a `Host` on Android).
   * @default false
   */
  fillWidth?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}
