import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import {Button} from '../button';
import {HeaderHost, useHeaderTrigger} from '../header/shared';

export interface HeaderActionProps {
  /** Trigger text (kept for accessibility when `hideLabel` is set). */
  label: string;
  /** Trigger icon. */
  icon?: IconToken;
  /** Called when the action is pressed. */
  onPress: () => void;
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
 * A plain press in a stack header's trailing slot (`TabStack`'s `headerRight`,
 * a `Stack.Screen`'s `headerRight` option): `HeaderMenu` without the menu —
 * the same trigger, at the platform's header size and in the same host, doing
 * one thing when pressed instead of opening a list.
 *
 * A `Button` on its own is the wrong thing there: it would be sized by the app
 * rather than by the platform's header metrics, it would not shrink when the
 * web tab bar carries the header, and natively it is a SwiftUI or Compose view,
 * which a React Native header cannot hold without a host. Needs a navigator
 * above it on Android (it reads the screen's focus). Put more than one in a
 * `HeaderActions`.
 */
export function HeaderAction(props: HeaderActionProps) {
  return (
    <HeaderHost>
      <HeaderActionTrigger {...props}/>
    </HeaderHost>
  );
}

function HeaderActionTrigger({label, icon, onPress, hideLabel, tone = 'accent', disabled, testID}: HeaderActionProps) {
  const {size, iconSize} = useHeaderTrigger();
  return (
    <Button
      label={label}
      prefixIcon={icon}
      onPress={onPress}
      hideLabel={hideLabel}
      tone={tone}
      disabled={disabled}
      variant="text"
      size={size}
      iconSize={iconSize}
      testID={testID}
    />
  );
}
