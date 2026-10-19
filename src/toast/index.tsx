import type {ToastProps} from './types';
import {useEffect, useState} from 'react';
import {AccessibilityInfo, Platform, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {NativeHost} from '../host';
import {useOverlayMaterial} from '../material/context';
import {Surface} from '../surface';
import {Footnote} from '../typography';
import {spacing} from '../theme';
import {useToastInset} from './context';
import {TOAST_DURATION} from './types';

/**
 * iOS has no live regions, so the toast has VoiceOver read its message
 * itself, as it shows and when the message changes while it is up. The
 * announcement is queued, so VoiceOver reads it once it is done speaking, as
 * a polite live region would. Web hears it through `role="status"`.
 */
const ANNOUNCES = Platform.OS === 'ios';

/**
 * iOS and web draw the toast: a raised capsule pinned above the bottom of
 * the screen, announced as a live region on web (`role="status"`) and by
 * an announcement on iOS (`ANNOUNCES`). Neither
 * platform has a toast control of its own — Apple's apps draw this same
 * capsule — while Android has the Material `Snackbar` (`index.android.tsx`).
 * On the web the capsule draws on the app's overlay material unless told
 * otherwise.
 */
export function Toast({message, visible, action, onDismiss, duration = TOAST_DURATION, material, testID}: ToastProps) {
  const glass = useOverlayMaterial(material);
  useEffect(() => {
    if (!visible || !onDismiss || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, onDismiss]);
  useEffect(() => {
    if (ANNOUNCES && visible) AccessibilityInfo.announceForAccessibilityWithOptions(message, {queue: true});
  }, [visible, message]);
  // What the toast covers of the screen's bottom edge, for its fab to clear:
  // the capsule and the gap under it.
  const [height, setHeight] = useState(0);
  useToastInset(visible && height > 0 ? height + spacing.four : 0);

  if (!visible) return null;

  return (
    <View style={styles.slot} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      <Surface
        raised
        radius="pill"
        color="element"
        border="all"
        material={glass}
        padding={spacing.two}
        style={styles.toast}
        testID={testID}>
        <View
          accessibilityLiveRegion="polite"
          // react-native-web maps the status role onto `role="status"`.
          role={Platform.OS === 'web' ? 'status' : undefined}
          style={styles.text}>
          <Footnote color="label">{message}</Footnote>
        </View>
        {action ? (
          // The action is a native button: outside a host it has nothing to draw in.
          <NativeHost fit>
            <Button
              label={action.label}
              variant="text"
              size="small"
              onPress={() => {
                action.onPress();
                onDismiss?.();
              }}
            />
          </NativeHost>
        ) : null}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.four,
    alignItems: 'center',
    // The strip spans the screen; only the toast in it takes presses.
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    paddingHorizontal: spacing.three,
    maxWidth: '90%',
  },
  text: {
    flexShrink: 1,
  },
});
