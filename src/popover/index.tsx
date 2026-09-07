import type {LayoutChangeEvent} from 'react-native';
import type {PopoverProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Row} from '@expo/ui';
import {Button} from '../button';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {Footnote, Subheadline} from '../typography';
import {spacing} from '../theme';

/** Space between the rectangle and the card, and from the parent's edges. */
const GAP = 8;

/**
 * A card pointing at a rectangle on a canvas (see {@link PopoverProps}). It
 * fills its parent as a `box-none` overlay, measures it, and places the card
 * inside those bounds: below the rectangle, or above it when the bottom is
 * too close.
 */
export function Popover({at, title, message, actions, onDismiss, width = 280, children, testID}: PopoverProps) {
  const [bounds, setBounds] = useState({width: 0, height: 0});
  const [height, setHeight] = useState(0);
  const onBounds = (event: LayoutChangeEvent) => {
    const {width: w, height: h} = event.nativeEvent.layout;
    if (w !== bounds.width || h !== bounds.height) setBounds({width: w, height: h});
  };
  const onCard = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next !== height) setHeight(next);
  };

  const below = at ? at.y + (at.height ?? 0) + GAP : 0;
  // Above the rectangle when the card would run past the bottom edge.
  const flip = !!at && bounds.height > 0 && below + height + GAP > bounds.height;
  const top = at ? (flip ? Math.max(GAP, at.y - height - GAP) : below) : 0;
  // Until the parent has been measured there is nothing to clamp against.
  const rightMost = bounds.width > 0 ? Math.max(GAP, bounds.width - width - GAP) : Infinity;
  const left = at ? Math.max(GAP, Math.min(at.x, rightMost)) : 0;

  return (
    <View
      testID={testID ? `${testID}-bounds` : undefined}
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={onBounds}>
      {at ? (
        <Surface
          raised
          border="all"
          padding={spacing.three}
          onLayout={onCard}
          style={[styles.card, {width, left, top}]}
          testID={testID}>
          {title ? <Subheadline color="label" weight="semibold">{title}</Subheadline> : null}
          {message ? <Footnote color="secondaryLabel">{message}</Footnote> : null}
          {children}
          {actions?.length ? (
            <NativeHost fit style={styles.actions}>
              <Row alignment="center" spacing={spacing.two}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    label={action.label}
                    variant="text"
                    size="small"
                    role={action.role}
                    onPress={() => {
                      action.onPress();
                      onDismiss?.();
                    }}
                  />
                ))}
              </Row>
            </NativeHost>
          ) : null}
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    gap: spacing.one,
  },
  actions: {
    marginTop: spacing.one,
  },
});
