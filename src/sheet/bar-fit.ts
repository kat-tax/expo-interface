import type {SheetBarProps} from './shared';
import {useState} from 'react';
import {BAR_SIDE, accessoryFits, barSide, drawsSomething} from './shared';

/** What the bar draws from what it measured. */
export interface SheetBarFit {
  /** Whether the accessory is in the bar; with an accessory and not in the bar, it is in a row of its own under it. */
  inBar: boolean;
  /** The least width of each end. */
  side: number;
  /** Takes the width of the leading end's content. */
  onLeading: (width: number) => void;
  /** Takes the width of the trailing end's content. */
  onTrailing: (width: number) => void;
}

/**
 * The bar's measurements and what it draws from them, alike on every
 * platform: whether the accessory placed in the bar sits there
 * (`accessoryFits`), and the least width of the two ends, both the wider
 * end's with a title or a subtitle to centre and `BAR_SIDE` without.
 * `bar` is the bar's width, undefined until it is measured.
 *
 * Each end reports its content's width, not its own: an end holds the
 * least width it is given, so a report of its own would keep the ends at
 * the widest they ever were. While the accessory is in its row the leading
 * end holds the back button alone, so the width it had with the accessory
 * in it is kept from when it was in the bar: that is what says whether the
 * accessory goes back to the bar when the bar's width changes, where the
 * narrower end would put it back only for it to leave again.
 */
export function useSheetBarFit({title, subtitle, accessory}: Pick<SheetBarProps, 'title' | 'subtitle' | 'accessory'>, bar: number | undefined): SheetBarFit {
  const [leading, setLeading] = useState<number>();
  const [trailing, setTrailing] = useState<number>();
  const [crowded, setCrowded] = useState<number>();
  const titled = title !== undefined || subtitle !== undefined;
  const inBar = drawsSomething(accessory) && accessoryFits({bar, leading: crowded, trailing}, titled);
  return {
    inBar,
    side: titled ? barSide(leading, trailing) : BAR_SIDE,
    onLeading: width => {
      setLeading(width);
      if (inBar) setCrowded(width);
    },
    onTrailing: width => setTrailing(width),
  };
}
