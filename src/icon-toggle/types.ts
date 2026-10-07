import type {IconToken} from '../icons';

/**
 * A round icon button with two states: the star on a document, the pin on a
 * note, a tool that stays down while it is on.
 *
 * Bridges the Material 3 `IconToggleButton` on Android, a SwiftUI `Button`
 * carrying the selected trait on iOS, and an `aria-pressed` `<button>` on
 * web. Two icons rather than a color change, because that is how a toggle
 * reads on every platform: the outline when off, the filled glyph when on.
 */
export interface IconToggleProps {
  /** Accessibility name of the toggle. */
  label: string;
  /** Icon shown while off. */
  icon: IconToken;
  /** Icon shown while on. Defaults to `icon`. */
  activeIcon?: IconToken;
  /** Whether the toggle is on. */
  value: boolean;
  /** Called with the new state when the toggle is pressed. */
  onValueChange: (value: boolean) => void;
  /** Color while on. Defaults to the theme tint. */
  color?: string;
  /** Color while off. Defaults to the theme `secondaryLabel`. */
  offColor?: string;
  /**
   * Icon size in points/dp.
   * @default 24
   */
  size?: number;
  /** Disables interaction and dims the toggle. */
  disabled?: boolean;
  /**
   * What the toggle is while it is off. `hidden` draws nothing: not drawn,
   * not pressable and not announced, for a control a `Card` reveals under
   * the pointer and a star that is set stays. The space it took is kept on
   * iOS, web and Windows, and given up on Android, where Compose has nothing
   * that hides a control from TalkBack short of leaving it out.
   * @default 'visible'
   */
  offVisibility?: 'visible' | 'hidden';
  /** Identifier used to locate the toggle in end-to-end tests. */
  testID?: string;
}
