import type {ReactNode, Ref} from 'react';
import type {TextFieldCapitalize} from '../text-field/types';

/**
 * Where the search goes, in the platforms' own words.
 *
 * - `stacked`: a field under the title. Native on iOS (`UISearchController`,
 *   collapsing as the content scrolls), mirrored elsewhere as a row under
 *   the header.
 * - `integrated`: the search in a bottom toolbar. Native on iOS 26, where it
 *   is the toolbar's own glass; a bottom `Toolbar` with the field elsewhere.
 * - `action`: a magnifier among the header's actions that expands into a
 *   field across the bar. Native on Android (the toolbar's `SearchView`) and
 *   on iOS 26 (the bar's search button); drawn on web and Windows.
 * - `inline`: a field in the bar beside the title, the desktop look. Native
 *   on iOS 16 to 18; drawn on web as a frameless field on the bar's own
 *   fill, beside the logo in a `Tabs` bar, that takes the bar's spare width
 *   and shrinks with it; Windows' `AutoSuggestBox`; Android's `SearchView`
 *   open from the start.
 * - `automatic`: the platform's choice. iOS decides itself; Android takes
 *   `action`; web and Windows take `inline`, at every width.
 */
export type HeaderSearchPlacement = 'automatic' | 'stacked' | 'integrated' | 'action' | 'inline';

/**
 * iOS 26's three integrated looks: a field in the toolbar, a button that
 * expands into one, or a field centred in the bar where the width allows.
 */
export type HeaderSearchIntegration = 'field' | 'button' | 'centered';

/** The keyboard Android's field opens with. */
export type HeaderSearchInput = 'text' | 'phone' | 'number' | 'email';

/**
 * What a `HeaderSearch` can be told to do through its `ref`. No native
 * search field is controlled, so the text is set this way rather than by a
 * `value` prop; a change made here is not reported through `onChangeText`,
 * as the platforms' own commands are not.
 */
export interface HeaderSearchCommands {
  /** Focuses the field, opening it first where the placement keeps it closed. */
  focus(): void;
  blur(): void;
  setText(text: string): void;
  /** Empties the field. */
  clear(): void;
  /** Empties the field, gives up the focus and closes an open search: iOS's cancel. */
  cancel(): void;
}

/**
 * What a search's placeholder can depend on. `size` is `short` while the web
 * bar is too narrow for its labels and its inline field is at its floor, and
 * `full` everywhere else, the native placements included.
 */
export interface HeaderSearchState {
  size: 'full' | 'short';
}

/** A placeholder: a string, or what to say for the search's state. */
export type HeaderSearchPlaceholder = string | ((state: HeaderSearchState) => string);

export interface HeaderSearchProps {
  /**
   * Where the search goes. See {@link HeaderSearchPlacement} for what each
   * platform draws for each.
   * @default 'automatic'
   */
  placement?: HeaderSearchPlacement;
  /**
   * Shown while the field is empty, and its accessible name: a string, or a
   * function of the search's state, which a narrow web bar asks for a short
   * one (`'Search docs'` where `'Search documents'` would be cut). The
   * accessible name is always the answer for `{size: 'full'}`.
   */
  placeholder?: HeaderSearchPlaceholder;
  /** Focuses the field once it is mounted, opening it where the placement keeps it closed. */
  autoFocus?: boolean;
  /** Automatic capitalization while typing; the platform's default when omitted. */
  autoCapitalize?: TextFieldCapitalize;
  /**
   * The keyboard Android's field opens with.
   * @default 'text'
   */
  inputType?: HeaderSearchInput;
  /**
   * iOS `stacked` only: the field collapses as the content scrolls and comes
   * back on a pull. The drawn rows stay where they are.
   * @default true
   */
  hideWhenScrolling?: boolean;
  /**
   * iOS 26 `integrated` only: which of the toolbar's looks the search takes.
   * @default 'field'
   */
  integration?: HeaderSearchIntegration;
  /** The text as it is typed, or cleared. */
  onChangeText?: (text: string) => void;
  /** The search key, or the search button. */
  onSubmit?: (text: string) => void;
  /**
   * The search opened: an `action` expanded, a field took the focus, iOS's
   * controller became active.
   */
  onOpen?: () => void;
  /**
   * The search closed: an `action` collapsed, a field gave up the focus,
   * iOS's cancel.
   */
  onClose?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** The commands, see {@link HeaderSearchCommands}. */
  ref?: Ref<HeaderSearchCommands>;
  /**
   * Identifier used to locate the field in end-to-end tests. An `action`
   * placement's magnifier is `${testID}-open` where the kit draws it.
   */
  testID?: string;
}

/** What a drawn header draws for a placement: the row under the title, the field in the row, or the magnifier. */
export type DrawnSearchPlacement = 'stacked' | 'inline' | 'action';

/**
 * A screen's search as a drawn header receives it through the route's
 * options (`headerSearch`): the placement asked for, which the header
 * resolves (`automatic` by its width), and the element that draws the field.
 */
export interface HeaderSearchSlot {
  placement: Exclude<HeaderSearchPlacement, 'integrated'>;
  node: ReactNode;
}
