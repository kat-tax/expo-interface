import type {SnackbarHostRef} from '@expo/ui/jetpack-compose';
import type {ToastProps} from './types';
import {useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {Snackbar, SnackbarHost, useMaterialColors} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {TOAST_DURATION} from './types';

/**
 * Android shows the Material 3 `Snackbar`, asked for imperatively through
 * the host's ref while `visible`; Compose owns its timing, its animation and
 * its queue, and resolves the call when the message goes away. The host is a
 * bottom overlay of its own, so a toast can be rendered from anywhere in a
 * React Native screen.
 */
export function Toast({message, visible, action, onDismiss, duration = TOAST_DURATION, testID}: ToastProps) {
  const colors = useMaterialColors();
  const host = useRef<SnackbarHostRef>(null);
  // The action and the dismissal are read when the snackbar resolves, which
  // can be seconds after the render that showed it.
  const latest = useRef({action, onDismiss});
  latest.current = {action, onDismiss};

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    host.current?.showSnackbar({
      message,
      actionLabel: action?.label,
      duration: duration > TOAST_DURATION ? 'long' : 'short',
    }).then(result => {
      if (cancelled) return;
      if (result === 'actionPerformed') latest.current.action?.onPress();
      latest.current.onDismiss?.();
    });
    return () => {
      cancelled = true;
    };
    // The message is what is shown; the callbacks are read through `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message, duration, action?.label]);

  return (
    <NativeHost style={styles.slot} pointerEvents="box-none">
      <SnackbarHost ref={host} modifiers={testID ? [testIDModifier(testID)] : undefined}>
        <Snackbar
          containerColor={colors.inverseSurface}
          contentColor={colors.inverseOnSurface}
          actionContentColor={colors.inversePrimary}
        />
      </SnackbarHost>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
