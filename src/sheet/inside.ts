import {createContext} from 'react';

/**
 * Android: whether a component is in a `Sheet`'s content, a window of its
 * own. Android gives a new window's focus to the first view that takes the
 * focus in touch mode, as a selectable text does, and draws its focus
 * highlight over that view.
 */
export const InSheetContext = createContext(false);
