import {createContext} from 'react';

/**
 * True around a kit `Button` that is a `FieldGroup` row of its own: a direct
 * child of the group or of one of its sections, not one nested in a row's
 * content. SwiftUI's `Form` gives such a button the whole cell, so on iOS the
 * button takes a tap anywhere along the row; the other platforms draw their
 * rows themselves and read nothing from it.
 */
export const FieldRowContext = createContext(false);
