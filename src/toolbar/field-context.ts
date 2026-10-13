import {createContext, useContext} from 'react';

/**
 * The height of the controls of the bar a `field` sits in, in points, for a
 * field drawn to the bar's size: the kit's small button on the web and
 * Windows, the bar button on iOS, Material's icon button on Android. The
 * edge bar provides it around its `field`; `undefined` outside a bar. For
 * the kit's own fields, not exported from the package.
 */
export const ToolbarFieldContext = createContext<number | undefined>(undefined);

/** The height of the controls of the bar the field is in, or `undefined` outside a bar. */
export function useToolbarControlHeight(): number | undefined {
  return useContext(ToolbarFieldContext);
}
