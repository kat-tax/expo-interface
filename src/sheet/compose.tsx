import type {ReactNode} from 'react';
import type {SheetProps} from './types';
import {SheetActions} from './actions';
import {SheetBar} from './bar';
import {SheetBody} from './body';
import {SheetHosted} from './hosted';
import {NO_SCROLL_INSETS, ScrollInsetsContext} from '../screen/insets';
import {drawsSomething, hasBar, sub} from './shared';

/**
 * What goes inside the platform's sheet, in order: the bar when anything
 * asks for it, the accessory under it, the body, the footer, and the
 * actions along the bottom edge, stacked in one column (Compose's on
 * Android, a `VStack` on iOS, a box on web). On iOS and Android the bar,
 * the accessory and a body without `maxHeight` are the sheet's native
 * content, while a capped body and the footer are React Native content,
 * each hosted in the sheet at the sheet's width. None of it is under a
 * screen's bar, so the screen's scroll insets stop at the sheet.
 */
export function sheetChildren({title, subtitle, onBack, onClose, menu, accessory, footer, actions, maxHeight, contentPadding, testID, children}: SheetProps): ReactNode {
  return (
    <ScrollInsetsContext.Provider value={NO_SCROLL_INSETS}>
      {hasBar({title, onBack, onClose, menu}) ? (
        <SheetBar title={title} subtitle={subtitle} onBack={onBack} onClose={onClose} menu={menu} testID={sub(testID, 'bar')}/>
      ) : null}
      {accessory}
      <SheetBody maxHeight={maxHeight} contentPadding={contentPadding} testID={sub(testID, 'body')}>{children}</SheetBody>
      {drawsSomething(footer) ? (
        <SheetHosted contentPadding={contentPadding} testID={sub(testID, 'footer')}>{footer}</SheetHosted>
      ) : null}
      {actions && actions.length > 0 ? <SheetActions actions={actions} testID={sub(testID, 'actions')}/> : null}
    </ScrollInsetsContext.Provider>
  );
}

/** The sheet's own props and its children, apart from what the platform's sheet takes. */
export function sheetOwnProps({title, subtitle, onBack, onClose, menu, accessory, footer, actions, maxHeight, material, children, ...rest}: SheetProps) {
  return {own: {title, subtitle, onBack, onClose, menu, accessory, footer, actions, maxHeight, material}, children, rest};
}
