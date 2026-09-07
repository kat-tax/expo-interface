import type {ButtonSize, ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {useState} from 'react';
import {Platform} from 'react-native';
import {useIsFocused} from 'expo-router';
import {NativeHost} from '../host';
import {Menu} from '../menu';

/**
 * A header action is the platform's, not the kit's smallest button: on iOS
 * 17pt text or a 22pt symbol, on Android a Material text button beside a
 * 24dp icon.
 */
const TRIGGER_SIZE = Platform.select<ButtonSize>({ios: 'large', default: 'medium'});
const TRIGGER_ICON = Platform.select({ios: 22, default: 24});

export interface HeaderMenuProps {
  /** Trigger text (kept for accessibility when `hideLabel` is set). */
  label: string;
  /** Trigger icon. */
  icon?: IconToken;
  /** Entries shown when the menu opens. */
  items: MenuItem[];
  /** Show only the icon; `label` is kept for accessibility. */
  hideLabel?: boolean;
  /**
   * Color of the trigger: the accent, or the label color like the header's
   * own buttons.
   * @default 'accent'
   */
  tone?: ButtonTone;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Called when the menu opens and closes (not reported on iOS). */
  onOpenChange?: (open: boolean) => void;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/**
 * A `Menu` for a stack header's trailing slot (`TabStack`'s `headerRight`,
 * a `Stack.Screen`'s `headerRight` option): the trigger at the platform's
 * header size, in its own accent-seeded host so it can live in the React
 * Native header.
 *
 * On Android the native stack re-parents the header's views on a tab switch,
 * and a Compose view refuses a second parent ("The specified child already
 * has a parent"). The host is therefore keyed on the screen's focus, so the
 * Compose view is created afresh each time the header is rebuilt rather
 * than re-added. Needs a navigator above it on Android (it reads the
 * screen's focus); on web it is the plain `Menu` trigger, for a custom
 * header such as `ConstrainedStackHeader`.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  if (Platform.OS === 'web') return <HeaderMenuTrigger {...props}/>;
  if (Platform.OS === 'android') return <AndroidHeaderMenu {...props}/>;
  return (
    <NativeHost fit>
      <HeaderMenuTrigger {...props}/>
    </NativeHost>
  );
}

function HeaderMenuTrigger({label, icon, items, hideLabel, tone = 'accent', disabled, onOpenChange, testID}: HeaderMenuProps) {
  return (
    <Menu
      label={label}
      icon={icon}
      items={items}
      hideLabel={hideLabel}
      tone={tone}
      disabled={disabled}
      onOpenChange={onOpenChange}
      variant="text"
      size={TRIGGER_SIZE}
      iconSize={TRIGGER_ICON}
      testID={testID}
    />
  );
}

function AndroidHeaderMenu(props: HeaderMenuProps) {
  // Keyed on the screen's focus: a fresh host, and Compose view, per rebuild.
  return <AndroidHeaderTrigger key={useIsFocused() ? 'focused' : 'blurred'} {...props}/>;
}

function AndroidHeaderTrigger(props: HeaderMenuProps) {
  // The toolbar lays its end-gravity subviews out against the header's end
  // inset once React has given them a size. A host measured by Compose alone
  // reports none, so one created after the toolbar was laid out overflows
  // past the inset, flush with the screen's edge. Reporting the measured
  // size back as the host's own style puts it back where the first mount was.
  const [size, setSize] = useState<{width: number; height: number} | null>(null);
  return (
    <NativeHost
      fit
      style={size ?? undefined}
      onLayoutContent={({nativeEvent}) => {
        if (nativeEvent.width === size?.width && nativeEvent.height === size?.height) return;
        setSize({width: nativeEvent.width, height: nativeEvent.height});
      }}>
      <HeaderMenuTrigger {...props}/>
    </NativeHost>
  );
}
