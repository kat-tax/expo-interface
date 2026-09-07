import type {ToastProps} from './types';
import {useEffect} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {Footnote} from '../typography';
import {spacing} from '../theme';
import {TOAST_DURATION} from './types';

/**
 * iOS and web draw the toast: a raised capsule pinned above the bottom of
 * the screen, announced as a live region (`role="status"` on web). Neither
 * platform has a toast control of its own — Apple's apps draw this same
 * capsule — while Android has the Material `Snackbar` (`index.android.tsx`).
 */
export function Toast({message, visible, action, onDismiss, duration = TOAST_DURATION, testID}: ToastProps) {
  useEffect(() => {
    if (!visible || !onDismiss) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.slot}>
      <Surface
        raised
        radius="pill"
        color="element"
        border="all"
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
