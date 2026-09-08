import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {HeaderHost, useHeaderTrigger} from '../header/shared';
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
  /** Called when the menu opens and closes (not reported on iOS). */
  onOpenChange?: (open: boolean) => void;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/**
 * A `Menu` for a stack header's trailing slot (`TabStack`'s `headerRight`, a
 * `Stack.Screen`'s `headerRight` option): the trigger at the platform's header
 * size, in its own accent-seeded host so it can live in the React Native
 * header — or in the one a `HeaderActions` around it already mounted. Needs a
 * navigator above it on Android (it reads the screen's focus); on web it is
 * the plain `Menu` trigger, for a custom header such as
 * `ConstrainedStackHeader`. See `HeaderAction` for one that presses.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  return (
    <HeaderHost>
      <HeaderMenuTrigger {...props}/>
    </HeaderHost>
  );
}

function HeaderMenuTrigger({label, icon, items, hideLabel, tone = 'accent', disabled, onOpenChange, testID}: HeaderMenuProps) {
  const {size, iconSize} = useHeaderTrigger();
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
      size={size}
      iconSize={iconSize}
      testID={testID}
    />
  );
}
