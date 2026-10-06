import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {HeaderHost, useHeaderTrigger, useInHeader} from '../header/shared';
import {HeaderSlot} from '../header/slot';
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
  /** Called when the menu opens and closes. Not reported on iOS and Android, where the platform presents the menu. */
  onOpenChange?: (open: boolean) => void;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/**
 * A `Menu` for a stack header's trailing slot: the trigger at the platform's
 * header size, with the entries behind it. Rendered in the screen's content
 * and sent to the header from there, as `HeaderAction` describes: on iOS a
 * navigation bar menu item (its entries a `UIMenu`), on Android the top app
 * bar's icon button with a dropdown, both made from this element's props by
 * the slot (`header/toolbar.tsx`); on web and Windows the plain `Menu`
 * trigger in the drawn header row, or in the web tab bar the header folds
 * into. Rendered inside a header already, it draws itself in place.
 */
export const HeaderMenu = Object.assign(
  function HeaderMenu(props: HeaderMenuProps) {
    const inHeader = useInHeader();
    if (!inHeader) return <HeaderSlot><HeaderMenu {...props}/></HeaderSlot>;
    return (
      <HeaderHost>
        <HeaderMenuTrigger {...props}/>
      </HeaderHost>
    );
  },
  // What the native slot reads this element as, without rendering it.
  {item: 'menu' as const},
);

function HeaderMenuTrigger({label, icon, items, hideLabel, tone = 'accent', disabled, onOpenChange, testID}: HeaderMenuProps) {
  const {size, iconSize, iconOnly} = useHeaderTrigger();
  return (
    <Menu
      label={label}
      icon={icon}
      items={items}
      // In a bar too narrow for labels the icon stands alone, when there is one.
      hideLabel={hideLabel || (iconOnly && icon != null)}
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
