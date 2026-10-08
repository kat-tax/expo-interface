import type {PopoverProps} from './types';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import {Row} from '@expo/ui';
import {useAnchored} from '../anchored';
import {Button} from '../button';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {Footnote, Subheadline} from '../typography';
import {spacing} from '../theme';
import {MODAL_CARD, useEscape, useLinger} from './shared';

/**
 * A card pointing at a rectangle on a canvas (see {@link PopoverProps}). It
 * fills its parent as a `box-none` overlay, measures it, and places the card
 * inside those bounds, clear of the insets: below the rectangle, or above it
 * when the bottom is too close. A modal one takes the presses on the rest of
 * the parent as its backdrop; a hover one lingers once the pointer has gone.
 */
export function Popover({at, title, message, actions, onDismiss, width = 280, preferredEdge = 'auto', modal = false, insets, trigger = 'manual', grace, children, testID}: PopoverProps) {
  const linger = useLinger(at, trigger === 'hover', grace, () => onDismiss?.('leave'));
  const shown = linger.shown;
  const anchored = useAnchored({at: shown, preferredEdge, width, insets});
  const escape = () => {
    linger.end();
    onDismiss?.('escape');
  };
  useEscape(Platform.OS === 'web' && shown !== null, escape);

  return (
    <View
      testID={testID ? `${testID}-bounds` : undefined}
      style={[styles.bounds, modal && shown ? styles.modal : null]}
      onLayout={anchored.onBounds}>
      {modal && shown ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.backdrop}
          onPress={() => onDismiss?.('backdrop')}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
      ) : null}
      {shown ? (
        // The placed box carries the pointer and what a modal card says of
        // itself; the surface inside it is the card. On web the modal card is
        // a dialog element, named by its title; iOS and Android read the
        // title in the card itself.
        <View
          onLayout={anchored.onCard}
          style={[styles.card, {width, left: anchored.left, top: anchored.top}]}
          testID={testID}
          {...linger.props}
          {...(modal ? {...MODAL_CARD, 'aria-label': Platform.OS === 'web' ? title : undefined, onAccessibilityEscape: escape} : null)}>
          <Surface raised border="all" padding={spacing.three} style={styles.body}>
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
                        onDismiss?.('action');
                      }}
                    />
                  ))}
                </Row>
              </NativeHost>
            ) : null}
          </Surface>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The measured box covers the screen but takes no presses of its own; only
  // the card in it does. `pointerEvents` lives in the style, not the prop,
  // which React Native has deprecated.
  bounds: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  // A modal popover's box is its backdrop: nothing under it takes a press.
  modal: {
    pointerEvents: 'auto',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    position: 'absolute',
  },
  body: {
    gap: spacing.one,
  },
  actions: {
    marginTop: spacing.one,
  },
});

export type {PopoverAction, PopoverDismissReason, PopoverInsets, PopoverProps, PopoverRect} from './types';
