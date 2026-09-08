import type {ButtonSize} from '../button/types';
import type {PropsWithChildren} from 'react';
import {useState} from 'react';
import {Platform} from 'react-native';
import {useIsFocused} from 'expo-router';
import {NativeHost, useNativeHost} from '../host';
import {useInBar} from '../tabs/context';

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
 * tabs, and a header-sized control would grow it.
 *
 * The fold is the half an app outside the kit cannot get right: `InBarContext`
 * is the bar's own, so a header control written in an app either hardcodes the
 * bar's size (wrong the moment `Tabs webFoldHeader` is off) or the header's
 * (wrong beside the kit's controls, which shrink). Every header control the
 * kit ships reads it from here instead.
 */
export function useHeaderTrigger(): {size: ButtonSize; iconSize: number} {
  return useInBar()
    ? {size: BAR_SIZE, iconSize: BAR_ICON}
    : {size: TRIGGER_SIZE, iconSize: TRIGGER_ICON};
}

/**
 * The host a header control needs to live in a React Native header — and
 * nothing at all where it is already inside one, so a `HeaderActions` can host
 * a whole row once (nesting hosts is not allowed) and its children stay usable
 * on their own.
 *
 * On Android the native stack re-parents the header's views on a tab switch,
 * and a Compose view refuses a second parent ("The specified child already has
 * a parent"). The host is therefore keyed on the screen's focus, so the Compose
 * view is created afresh each time the header is rebuilt rather than re-added —
 * which is why a header control needs a navigator above it there. On web there
 * is no host: the controls are DOM.
 */
export function HeaderHost({children}: PropsWithChildren) {
  const hosted = useNativeHost();
  if (Platform.OS === 'web' || hosted) return <>{children}</>;
  if (Platform.OS === 'android') return <AndroidHeaderHost>{children}</AndroidHeaderHost>;
  return <NativeHost fit>{children}</NativeHost>;
}

function AndroidHeaderHost({children}: PropsWithChildren) {
  // Keyed on the screen's focus: a fresh host, and Compose view, per rebuild.
  return <MeasuredHost key={useIsFocused() ? 'focused' : 'blurred'}>{children}</MeasuredHost>;
}

function MeasuredHost({children}: PropsWithChildren) {
  // The toolbar lays its end-gravity subviews out against the header's end
  // inset once React has given them a size. A host measured by Compose alone
  // reports none, so one created after the toolbar was laid out overflows past
  // the inset, flush with the screen's edge. Reporting the measured size back
  // as the host's own style puts it back where the first mount was.
  const [size, setSize] = useState<{width: number; height: number} | null>(null);
  return (
    <NativeHost
      fit
      style={size ?? undefined}
      onLayoutContent={({nativeEvent}) => {
        if (nativeEvent.width === size?.width && nativeEvent.height === size?.height) return;
        setSize({width: nativeEvent.width, height: nativeEvent.height});
      }}>
      {children}
    </NativeHost>
  );
}
