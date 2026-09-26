import type {ReactNode} from 'react';
import type {StackAnimation} from './motion';
import {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import {useEntrance} from './entrance';
import {keyHandlers} from './index';
import {useLayerDismiss} from './layer';
import {bound, useColor} from '../theme';

/** WinUI's `SmokeFillColorDefault`: the dim a dialog puts over the window. */
const SMOKE = 'rgba(0, 0, 0, 0.3)';

/** react-native-windows' `focus` command on a view: what moves the keyboard focus to the modal when it opens. */
const ViewCommands = codegenNativeCommands<{focus: (view: View) => void}>({supportedCommands: ['focus']});

/** react-native-windows' view props for a container that takes the focus without drawing a ring. */
const FOCUS_HOLDER = {focusable: true, enableFocusRing: false} as object;

export interface ModalLayerProps {
  children?: ReactNode;
  /** Asked when the smoke is pressed or Escape is pressed. */
  onDismiss?: () => void;
  /** Draw the children over the window as they are: no smoke, no card. */
  transparent?: boolean;
  /**
   * Give the card most of the window's height rather than its content's,
   * for content that fills what it is given — a screen — rather than
   * sizing itself.
   */
  tall?: boolean;
  /** How the card arrives: settling from a little larger as a dialog does, or as `fade` or `none` say; the other stack animations are the dialog's. */
  animation?: StackAnimation;
  testID?: string;
}

/**
 * A modal over the window, drawn in React Native: WinUI's smoke over
 * everything and a centred card in the scheme's background — a
 * `ContentDialog`'s arrangement for content a XAML dialog cannot hold — or,
 * transparent, the children laid over the window as they are. It takes the
 * keyboard focus when it opens, as a dialog does, so Tab moves into it and
 * Escape reaches it; a press on the smoke dismisses it, and so does Escape:
 * through the `LayerHost` wherever the focus is under it, or here when
 * there is no host. Rendered in a host to cover the window; the kit's
 * Windows stack presents modal routes and sheets with it.
 */
export function ModalLayer({children, onDismiss, transparent = false, tall = false, animation, testID}: ModalLayerProps) {
  const background = useColor('background');
  const separator = useColor('separator');
  const hosted = useLayerDismiss(onDismiss);
  const root = useRef<View>(null);
  const entrance = useEntrance(animation);
  useEffect(() => {
    try {
      // The view is mounted by the time the effect runs.
      ViewCommands.focus(root.current as View);
    } catch {
      // A renderer without the command (the test harness) leaves the focus where it is.
    }
  }, []);
  const keyboard = hosted
    ? {}
    : keyHandlers({
        onKeyDown: event => {
          if (event.nativeEvent.key === 'Escape') onDismiss?.();
        },
      });
  if (transparent) {
    return (
      <View ref={root} style={styles.fill} testID={testID} {...FOCUS_HOLDER} {...keyboard}>
        {children}
      </View>
    );
  }
  return (
    <View ref={root} style={[styles.fill, styles.centre]} testID={testID} {...FOCUS_HOLDER} {...keyboard}>
      <Pressable style={styles.smoke} onPress={onDismiss} accessibilityLabel="Dismiss" role="button"/>
      <Animated.View style={[styles.card, tall && styles.tall, {backgroundColor: background, borderColor: separator}, entrance]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  smoke: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SMOKE,
  },
  card: {
    width: '100%',
    maxWidth: bound.contentMaxWidth - 200,
    maxHeight: '90%',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
  },
  tall: {
    height: '85%',
  },
});
