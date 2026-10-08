import type {Ref} from 'react';
import type {LayoutChangeEvent, ViewProps} from 'react-native';
import type {useAnchored} from '../anchored';
import {createContext, useContext, useState} from 'react';
import {StyleSheet, View} from 'react-native';

export interface PlacedCardProps extends Omit<ViewProps, 'onLayout' | 'style'> {
  ref?: Ref<View>;
  /** Where the card goes, and the measure of it. */
  anchored: ReturnType<typeof useAnchored>;
  width: number;
  /**
   * Whether the card holds a `SizedRow` to wait for: a row of controls the
   * platform's toolkit sizes only after the card's first layout.
   * @default false
   */
  sizedLater?: boolean;
  /**
   * Holds the card back while the parent it is placed in is still to be
   * measured: on web, where the browser can report the card first. It holds
   * for one task after the card's own layout at most. react-native-web
   * measures each node the browser reports in a timeout of its own, in the
   * order they were reported, so a measure of the parent reported with the
   * card lands first, and a parent the browser never reports, one with no
   * size, does not keep the card hidden.
   * @default false
   */
  awaitingBounds?: boolean;
}

/** How a `SizedRow` tells the card around it that it has been laid out. */
const RowLayout = createContext<((event: LayoutChangeEvent) => void) | undefined>(undefined);

/**
 * The box a drawn popover's card sits in, at the place the anchoring gives
 * it. It is mounted each time the card comes up, and is neither seen nor
 * pressed until it has been measured, so the place it shows at is worked out
 * from its own height, not from the last card's or from none. With
 * `sizedLater` it also waits for the `SizedRow` in it to have a height, and
 * with `awaitingBounds` for its parent, a task after its own layout at most.
 */
export function PlacedCard({anchored, width, sizedLater = false, awaitingBounds = false, ...props}: PlacedCardProps) {
  const [measured, setMeasured] = useState(false);
  const [rowSized, setRowSized] = useState(false);
  // Only a card that comes up with the row waits for it, and only while it
  // still has one: a card that gains the row while it is up stays seen.
  const [cameWithRow] = useState(sizedLater);
  const [waited, setWaited] = useState(false);
  const ready = (!awaitingBounds || waited) && measured && (rowSized || !(cameWithRow && sizedLater));
  return (
    <RowLayout.Provider
      value={event => {
        if (event.nativeEvent.layout.height > 0) setRowSized(true);
      }}>
      <View
        {...props}
        onLayout={event => {
          anchored.onCard(event);
          setMeasured(true);
          if (awaitingBounds) setTimeout(() => setWaited(true), 0);
        }}
        style={[styles.card, {width, left: anchored.left, top: anchored.top}, ready ? null : styles.unplaced]}
      />
    </RowLayout.Provider>
  );
}

/**
 * A row of controls in a `PlacedCard` that the platform's toolkit sizes
 * after the card's first layout: the actions' `@expo/ui` host on iOS and
 * Android, the button islands on Windows. Until then the row has no height,
 * and a card placed by its height without the row would show below the
 * rectangle and then flip above it. A layout reaches the card before the
 * views inside it, so when the row first has a height, the card has already
 * been measured with it.
 */
export function SizedRow(props: Omit<ViewProps, 'onLayout'>) {
  const onLayout = useContext(RowLayout);
  return <View {...props} onLayout={onLayout}/>;
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
  },
  unplaced: {
    opacity: 0,
    pointerEvents: 'none',
  },
});
