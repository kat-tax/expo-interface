import type {ReactNode} from 'react';
import {Fragment, createContext, useContext, useId, useLayoutEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';

/** Which edge of the screen a bar sits on. */
export type ScreenBarEdge = 'top' | 'bottom';

/** Where a control in a screen's content puts a bar of the screen's own — see {@link ScreenBar}. */
export interface ScreenBars {
  /** Puts a bar on an edge, or takes it away (`null`). */
  set(id: string, edge: ScreenBarEdge, node: ReactNode | null): void;
}

export const ScreenBarsContext = createContext<ScreenBars | null>(null);

interface Entry {
  edge: ScreenBarEdge;
  node: ReactNode;
}

/**
 * The bars a `Screen` draws for the controls in its content: the rows at its
 * top, above the content, and the bars at its bottom, below it. A control
 * that mirrors a header the platform does not have (a `HeaderSearch` placed
 * `stacked` on Android, or `integrated` where there is no toolbar search)
 * puts its row here, so the row is the screen's wherever the control was
 * rendered, outside the content's host and clear of its gutter.
 */
export function useScreenBars(): {bars: ScreenBars; top: ReactNode; bottom: ReactNode; hasTop: boolean; hasBottom: boolean} {
  const [entries, setEntries] = useState<ReadonlyMap<string, Entry>>(() => new Map());
  const bars = useMemo<ScreenBars>(() => ({
    set(id, edge, node) {
      setEntries(previous => {
        const next = new Map(previous);
        if (node == null) next.delete(id);
        else next.set(id, {edge, node});
        return next;
      });
    },
  }), []);
  const on = (edge: ScreenBarEdge) => [...entries].filter(([, entry]) => entry.edge === edge);
  const top = on('top');
  const bottom = on('bottom');
  return {
    bars,
    top: top.map(([id, entry]) => <Fragment key={id}>{entry.node}</Fragment>),
    bottom: bottom.map(([id, entry]) => <Fragment key={id}>{entry.node}</Fragment>),
    hasTop: top.length > 0,
    hasBottom: bottom.length > 0,
  };
}

/**
 * A bar at an edge of the screen the control is rendered in: the `Screen`
 * draws it there, above or below its content. Without a `Screen` around the
 * control, the bar is drawn where the control is, a bottom one over the
 * bottom edge of the view it is in.
 */
export function ScreenBar({edge, children}: {edge: ScreenBarEdge; children: ReactNode}) {
  const bars = useContext(ScreenBarsContext);
  const id = useId();
  useLayoutEffect(() => {
    if (!bars) return undefined;
    bars.set(id, edge, children);
    return () => bars.set(id, edge, null);
  }, [bars, id, edge, children]);
  if (bars) return null;
  if (edge === 'bottom') return <View style={styles.bottom}>{children}</View>;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
