import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {ButtonVariant} from '../button/types';
import type {IconToken} from '../icons';
import {isValidElement} from 'react';

/**
 * The one thing to do about an empty screen, as data: the kit draws it as
 * its own `Button` inside the state's native view, so on iOS and Android the
 * action is native beside native text rather than a React Native hop between
 * the two.
 */
export interface EmptyStateAction {
  /** The button's text. */
  label: string;
  onPress?: () => void;
  /**
   * The button's emphasis.
   * @default 'filled'
   */
  variant?: ButtonVariant;
  icon?: IconToken;
  disabled?: boolean;
  /** The action is on its way: the button's spinner, and no presses. */
  loading?: boolean;
}

/**
 * What a screen shows when it has nothing to show: no drops yet, no results for
 * a search, no connection. A centred icon, a line saying what is missing, a
 * sentence saying why, and usually one thing to do about it.
 *
 * - iOS: `ContentUnavailableView`, the system's own, so it takes Apple's
 *   layout, its metrics and its Dynamic Type behaviour rather than an
 *   approximation of them. It needs iOS 17; below that the same layout is
 *   composed in SwiftUI.
 * - Android: a Compose column in one host, so the icon, the text and the
 *   action are one native view.
 * - Windows, web: composed from the kit's own icon and typography. Neither
 *   platform has a single control for this.
 *
 * On iOS and Android the state mounts a host outside one, as wide as its
 * container; inside one (a `Screen native`, a `NativeHost`, a `Sheet`, a
 * hosted `List`'s `empty`) it renders bare. There iOS centres the state and
 * its action as one in the space it is given, and on Android the container
 * places it.
 */
export interface EmptyStateProps {
  /** One line: what is not here. */
  title: string;
  /** A sentence under it: why, or what to do. It wraps, and can be selected. */
  description?: string;
  /** The icon above the title. */
  icon?: IconToken;
  /**
   * One thing to do about it: the kit's `Button`, from data, drawn inside the
   * platform's own view. A node of the app's own is React Native content: on
   * Android, and on iOS inside a host, it is hosted in the view, where the
   * kit's controls in it mount hosts of their own; on iOS outside a host it
   * sits below the view, and the web and Windows draw it under the
   * description.
   */
  action?: EmptyStateAction | ReactNode;
  /**
   * What is missing is on its way: the platform's spinner in the icon's
   * place, so a screen waiting for its record is the same empty state as one
   * that has none.
   * @default false
   */
  loading?: boolean;
  /**
   * Whether the description can be selected and copied: the reason a
   * document failed to open is worth pasting somewhere. On Android the
   * description is then React Native text hosted in the Compose column, since
   * `@expo/ui`'s Compose layer cannot select text.
   * @default true
   */
  selectable?: boolean;
  /**
   * Identifier used to locate the component in end-to-end tests. Inside a
   * host on iOS and Android, the native stack's identifier.
   */
  testID?: string;
  /**
   * The view the state is laid out in. Inside a host on iOS and Android the
   * state is native content with no such view, so it is not applied.
   */
  style?: StyleProp<ViewStyle>;
}

/** Whether an `action` is the kit's data rather than a node of the app's own. */
export function isActionData(action: EmptyStateProps['action']): action is EmptyStateAction {
  return typeof action === 'object' && action !== null && !isValidElement(action) && 'label' in action;
}
