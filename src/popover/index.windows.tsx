import type {LayoutChangeEvent} from 'react-native';
import type {PopoverProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlFlyout from '../windows/specs/ExpoInterfaceFlyoutNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {Button} from '../button';
import {Surface} from '../surface';
import {Footnote, Subheadline} from '../typography';
import {spacing} from '../theme';

/** Space between the rectangle and the drawn card, and from the parent's edges. */
const GAP = 8;

/**
 * Windows: a WinUI 3 `Flyout` — the platform's own popover, placed by the
 * system and dismissed by a click outside — holding the title, the message
 * and the actions, shown from an island laid exactly over the rectangle it
 * points at. A popover with `children` cannot go in a flyout (its content
 * is React Native's), so that one is drawn as the kit's `Surface`, placed
 * below the rectangle or above it when the bottom is too close.
 */
export function Popover(props: PopoverProps) {
  if (props.children != null) return <DrawnPopover {...props}/>;
  return <FlyoutPopover {...props}/>;
}

function FlyoutPopover({at, title, message, actions = [], onDismiss, width = 280, testID}: PopoverProps) {
  const xaml = useXamlProps();
  return (
    <View testID={testID ? `${testID}-bounds` : undefined} style={styles.bounds}>
      {at ? (
        <XamlFlyout
          open
          title={title}
          message={message}
          actions={jsonProp(actions.map(action => ({label: action.label, role: action.role ?? 'default'})))}
          width={width}
          onAction={event => {
            actions[event.nativeEvent.index]?.onPress();
            onDismiss?.();
          }}
          onOpenChange={event => {
            if (!event.nativeEvent.open) onDismiss?.();
          }}
          // The rectangle itself, at least a point on each side so the
          // flyout has something to be placed against.
          style={[styles.target, {left: at.x, top: at.y, width: Math.max(1, at.width ?? 0), height: Math.max(1, at.height ?? 0)}]}
          testID={testID}
          {...xaml}
        />
      ) : null}
    </View>
  );
}

function DrawnPopover({at, title, message, actions, onDismiss, width = 280, children, testID}: PopoverProps) {
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
  const flip = !!at && bounds.height > 0 && below + height + GAP > bounds.height;
  const top = at ? (flip ? Math.max(GAP, at.y - height - GAP) : below) : 0;
  const rightMost = bounds.width > 0 ? Math.max(GAP, bounds.width - width - GAP) : Infinity;
  const left = at ? Math.max(GAP, Math.min(at.x, rightMost)) : 0;

  return (
    <View testID={testID ? `${testID}-bounds` : undefined} style={styles.bounds} onLayout={onBounds}>
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
            <View style={styles.actions}>
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
            </View>
          ) : null}
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bounds: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  target: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  card: {
    position: 'absolute',
    gap: spacing.one,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    marginTop: spacing.one,
  },
});
