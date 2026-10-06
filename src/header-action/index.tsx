import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import {Button} from '../button';
import {HeaderHost, useHeaderTrigger, useInHeader} from '../header/shared';
import {HeaderSlot} from '../header/slot';

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
 * A plain press in a stack header's trailing slot: `HeaderMenu` without the
 * menu — the same control, doing one thing when pressed instead of opening a
 * list.
 *
 * A header control is rendered in the screen's content, beside the screen's
 * own views, and sends itself to the header from there: on iOS and Android it
 * becomes one of the platform's own header items (a navigation bar button
 * item, the top app bar's icon button), made from this element's props by
 * the slot (`header/toolbar.tsx`) rather than drawn; on web and Windows it
 * goes to the trailing slot of the drawn header row (and of the web tab bar
 * a header folds into), where it draws itself at the header's size. Rendered
 * inside a header already, it draws itself in place. More than one go in a
 * `HeaderActions`; `TabStack` takes them for a tab's root screen.
 *
 * A `Button` on its own is the wrong thing in a header: it would be sized by
 * the app rather than by the platform's header metrics, it would not shrink
 * when the web tab bar carries the header, and natively it would be a view in
 * a bar that takes items.
 */
export const HeaderAction = Object.assign(
  function HeaderAction(props: HeaderActionProps) {
    const inHeader = useInHeader();
    if (!inHeader) return <HeaderSlot><HeaderAction {...props}/></HeaderSlot>;
    return (
      <HeaderHost>
        <HeaderActionTrigger {...props}/>
      </HeaderHost>
    );
  },
  // What the native slot reads this element as, without rendering it.
  {item: 'action' as const},
);

function HeaderActionTrigger({label, icon, onPress, hideLabel, tone = 'accent', disabled, testID}: HeaderActionProps) {
  const {size, iconSize, iconOnly} = useHeaderTrigger();
  return (
    <Button
      label={label}
      prefixIcon={icon}
      onPress={onPress}
      // In a bar too narrow for labels the icon stands alone, when there is one.
      hideLabel={hideLabel || (iconOnly && icon != null)}
      tone={tone}
      disabled={disabled}
      variant="text"
      size={size}
      iconSize={iconSize}
      testID={testID}
    />
  );
}
