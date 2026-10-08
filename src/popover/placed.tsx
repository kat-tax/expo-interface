import type {ViewProps} from 'react-native';
import type {useAnchored} from '../anchored';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';

interface PlacedCardProps extends Omit<ViewProps, 'onLayout' | 'style'> {
  /** Where the card goes, and the measure of it. */
  anchored: ReturnType<typeof useAnchored>;
  width: number;
}

/**
 * The box a drawn popover's card sits in, at the place the anchoring gives
 * it. It is mounted each time the card comes up, and is neither seen nor
 * pressed until it has been measured, so the place it shows at is worked out
 * from its own height, not from the last card's or from none.
 */
export function PlacedCard({anchored, width, ...props}: PlacedCardProps) {
  const [measured, setMeasured] = useState(false);
  return (
    <View
      {...props}
      onLayout={event => {
        anchored.onCard(event);
        setMeasured(true);
      }}
      style={[styles.card, {width, left: anchored.left, top: anchored.top}, measured ? null : styles.unplaced]}
    />
  );
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
