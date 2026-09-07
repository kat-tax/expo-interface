import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {Platform} from 'react-native';
import {useIsFocused} from 'expo-router';
import {NativeHost} from '../host';
import {Menu} from '../menu';

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
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/**
 * A `Menu` for a stack header's trailing slot (`TabStack`'s `headerRight`,
 * a `Stack.Screen`'s `headerRight` option): a small text trigger in its own
 * accent-seeded host, so it can live in the React Native header.
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

function HeaderMenuTrigger({label, icon, items, hideLabel, tone = 'accent', disabled, testID}: HeaderMenuProps) {
  return (
    <Menu
      label={label}
      icon={icon}
      items={items}
      hideLabel={hideLabel}
      tone={tone}
      disabled={disabled}
      variant="text"
      size="small"
      testID={testID}
    />
  );
}

function AndroidHeaderMenu(props: HeaderMenuProps) {
  // Keyed on the screen's focus: a fresh host, and Compose view, per rebuild.
  return (
    <NativeHost key={useIsFocused() ? 'focused' : 'blurred'} fit>
      <HeaderMenuTrigger {...props}/>
    </NativeHost>
  );
}
