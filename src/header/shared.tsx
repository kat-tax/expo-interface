import type {ButtonSize} from '../button/types';
import type {PropsWithChildren} from 'react';
import {createContext, useContext} from 'react';
import {Platform} from 'react-native';
import {NativeHost, useNativeHost} from '../host';
import {useInBar, useNarrowBar} from '../tabs/context';

/** True inside a header's trailing slot — see {@link useInHeader}. */
export const InHeaderContext = createContext(false);

/**
 * Whether this is drawn inside a header already: a stack header's trailing
 * slot, or the web tab bar a header folds into. A header control rendered
 * there draws itself; rendered anywhere else, in a screen's content, it sends
 * itself to the screen's header instead (`HeaderSlot`) and draws nothing in
 * place.
 */
export function useInHeader(): boolean {
  const inHeader = useContext(InHeaderContext);
  const inBar = useInBar();
  return inHeader || inBar;
}

/**
 * A header action is the platform's, not the kit's smallest button: on iOS
 * 17pt text or a 22pt symbol, on Android a Material text button beside a
 * 24dp icon.
 */
const TRIGGER_SIZE = Platform.select<ButtonSize>({ios: 'large', default: 'medium'});
const TRIGGER_ICON = Platform.select({ios: 22, default: 24});

/** Folded into the web tab bar, the trigger is the bar's size, not a header's. */
const BAR_SIZE: ButtonSize = 'small';
const BAR_ICON = 18;

/**
 * What a header control draws at: the platform's header metrics, or the web
 * tab bar's while the header is folded into it — the bar is the height of its
 * tabs, and a header-sized control would grow it. `iconOnly` is set while
 * that bar is too narrow for its labels: a control with an icon shows the
 * icon alone and keeps its label as the accessible name, as the tabs do.
 *
 * The fold is the half an app outside the kit cannot get right: `InBarContext`
 * is the bar's own, so a header control written in an app either hardcodes the
 * bar's size (wrong the moment `Tabs webFoldHeader` is off) or the header's
 * (wrong beside the kit's controls, which shrink). Every header control the
 * kit ships reads it from here instead.
 */
export function useHeaderTrigger(): {size: ButtonSize; iconSize: number; iconOnly: boolean} {
  const inBar = useInBar();
  const narrow = useNarrowBar();
  return inBar
    ? {size: BAR_SIZE, iconSize: BAR_ICON, iconOnly: narrow}
    : {size: TRIGGER_SIZE, iconSize: TRIGGER_ICON, iconOnly: false};
}

/**
 * The host a drawn header control needs to live in a React Native view — and
 * nothing at all where it is already inside one, so a `HeaderActions` can host
 * a whole row once (nesting hosts is not allowed) and its children stay usable
 * on their own. On web there is no host: the controls are DOM. Natively the
 * bar's items need none either; the host is for the control Android's bar
 * cannot draw itself, in the bar's custom view (`header/toolbar.tsx`).
 */
export function HeaderHost({children}: PropsWithChildren) {
  const hosted = useNativeHost();
  if (Platform.OS === 'web' || hosted) return <>{children}</>;
  return <NativeHost fit>{children}</NativeHost>;
}
