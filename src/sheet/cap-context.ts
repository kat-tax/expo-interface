import {createContext} from 'react';

/**
 * The cap, in points, of the capped sheet body this point is inside, or
 * undefined anywhere else. On iOS and Android a body with `maxHeight` is
 * React Native content in a scroll view no taller than the cap, which gives
 * a child no height of its own to fill, so a `List` there takes the cap as
 * its height and scrolls inside it. The web's fraction is a viewport length
 * rather than points, and the web list scrolls itself, so there the context
 * carries only a cap given in points. Its own module, so the lists share it
 * with the body without importing the platform files that compute the cap.
 */
export const SheetBodyCapContext = createContext<number | undefined>(undefined);
