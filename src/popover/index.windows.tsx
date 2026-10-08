import type {PopoverDismissReason, PopoverProps} from './types';
import {Pressable, StyleSheet, View} from 'react-native';
import XamlTeachingTip from '../windows/specs/ExpoInterfaceTeachingTipNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {useAnchored} from '../anchored';
import {Button} from '../button';
import {NO_SCROLL_INSETS, ScrollInsetsContext} from '../screen/insets';
import {Surface} from '../surface';
import {Footnote, Subheadline} from '../typography';
import {spacing} from '../theme';
import {PlacedCard, SizedRow} from './placed';
import {MODAL_CARD, useLinger} from './shared';

/**
 * Windows: a WinUI 3 `TeachingTip` — the platform's own card with a tail,
 * placed by the system and dismissed by a click outside — holding the
 * title, the message and the actions, shown from an island laid exactly
 * over the rectangle it points at. A popover with `children` cannot go in
 * the tip (its content is React Native's), so that one is drawn as the
 * kit's `Surface`, placed below the rectangle or above it when the bottom is
 * too close; so is a `modal` or a `hover` one, which the tip has no form of.
 */
export function Popover(props: PopoverProps) {
  if (props.children != null || props.modal || props.trigger === 'hover') return <DrawnPopover {...props}/>;
  return <TipPopover {...props}/>;
}

function TipPopover({at, title, message, actions = [], onDismiss, width = 280, preferredEdge = 'auto', testID}: PopoverProps) {
  const xaml = useXamlProps();
  return (
    <View testID={testID ? `${testID}-bounds` : undefined} style={styles.bounds}>
      {at ? (
        <XamlTeachingTip
          open
          title={title}
          message={message}
          actions={jsonProp(actions.map(action => ({label: action.label, role: action.role ?? 'default'})))}
          width={width}
          preferredEdge={preferredEdge}
          onAction={event => {
            actions[event.nativeEvent.index]?.onPress();
            onDismiss?.('action');
          }}
          onOpenChange={event => {
            // A click outside the tip, which is the platform's own backdrop.
            if (!event.nativeEvent.open) onDismiss?.('backdrop');
          }}
          // The rectangle itself, at least a point on each side so the tip
          // has something to point its tail at.
          style={[styles.target, {left: at.x, top: at.y, width: Math.max(1, at.width ?? 0), height: Math.max(1, at.height ?? 0)}]}
          testID={testID}
          {...xaml}
        />
      ) : null}
    </View>
  );
}

function DrawnPopover({at, title, message, actions, onDismiss, width = 280, preferredEdge = 'auto', modal = false, label, insets, trigger = 'manual', grace, children, testID}: PopoverProps) {
  const linger = useLinger(at, trigger === 'hover', grace, () => onDismiss?.('leave'));
  const shown = linger.shown;
  const anchored = useAnchored({at: shown, preferredEdge, width, insets});
  // A dismissal of the card's own ends a linger, so the card goes as soon
  // as the app clears `at`.
  const dismiss = (reason: PopoverDismissReason) => {
    linger.end();
    onDismiss?.(reason);
  };
  // react-native-windows composes no name from the text inside a view, so a
  // modal card is named outright: an accessible view is a group to UI
  // Automation, with its name and with the buttons inside it still reached.
  const name = label || title;

  return (
    <View testID={testID ? `${testID}-bounds` : undefined} style={[styles.bounds, modal && shown ? styles.modal : null]} onLayout={anchored.onBounds}>
      {modal && shown ? (
        <Pressable
          accessibilityLabel="Dismiss"
          style={styles.backdrop}
          onPress={() => dismiss('backdrop')}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
      ) : null}
      {shown ? (
        // The button islands are sized by XAML after the card's first layout,
        // so the card waits for them.
        <PlacedCard
          anchored={anchored}
          width={width}
          sizedLater={!!actions?.length}
          testID={testID}
          {...linger.props}
          {...(modal ? {...MODAL_CARD, ...(name ? {accessible: true, accessibilityLabel: name} : null)} : null)}>
          <Surface raised border="all" padding={spacing.three} style={styles.body}>
            {title ? <Subheadline color="label" weight="semibold">{title}</Subheadline> : null}
            {message ? <Footnote color="secondaryLabel">{message}</Footnote> : null}
            {/* The card floats over the screen, under none of its bars: a list or a form in it pads by its own insets alone. */}
            <ScrollInsetsContext.Provider value={NO_SCROLL_INSETS}>{children}</ScrollInsetsContext.Provider>
            {actions?.length ? (
              <SizedRow style={styles.actions} testID={testID ? `${testID}-actions` : undefined}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    label={action.label}
                    variant="text"
                    size="small"
                    role={action.role}
                    onPress={() => {
                      action.onPress();
                      dismiss('action');
                    }}
                  />
                ))}
              </SizedRow>
            ) : null}
          </Surface>
        </PlacedCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bounds: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  modal: {
    pointerEvents: 'auto',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  target: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  body: {
    gap: spacing.one,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    marginTop: spacing.one,
  },
});

export type {PopoverAction, PopoverDismissReason, PopoverInsets, PopoverProps, PopoverRect} from './types';
