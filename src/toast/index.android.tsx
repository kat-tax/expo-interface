import type {SnackbarHostRef} from '@expo/ui/jetpack-compose';
import type {ToastProps} from './types';
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Snackbar, SnackbarHost, useMaterialColors} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {useToastInset} from './context';
import {TOAST_DURATION} from './types';

/**
 * The milliseconds a caller asks for, as one of the three lengths Compose
 * takes. Zero or less is Material's own indefinite snackbar, which stays
 * until its action is taken or it is dismissed; the kit spells that as a
 * duration because its own API is milliseconds on every platform.
 */
function snackbarLength(duration: number): 'short' | 'long' | 'indefinite' {
  if (duration <= 0) return 'indefinite';
  return duration > TOAST_DURATION ? 'long' : 'short';
}

/**
 * Android shows the Material 3 `Snackbar`, asked for imperatively through
 * the host's ref while `visible`; Compose owns its timing, its animation and
 * its queue, and resolves the call when the message goes away. The host is a
 * bottom overlay of its own, so a toast can be rendered from anywhere in a
 * React Native screen. The host takes the snackbar's height while one shows
 * and none otherwise, which is what the screen's fab lifts by, as Material's
 * own scaffold moves its button.
 */
export function Toast({message, visible, action, onDismiss, duration = TOAST_DURATION, testID}: ToastProps) {
  const colors = useMaterialColors();
  const host = useRef<SnackbarHostRef>(null);
  const [height, setHeight] = useState(0);
  useToastInset(visible ? height : 0);
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
      duration: snackbarLength(duration),
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
    <View style={styles.slot} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      <NativeHost pointerEvents="box-none">
        <SnackbarHost ref={host} modifiers={testID ? [testIDModifier(testID)] : undefined}>
          <Snackbar
            containerColor={colors.inverseSurface}
            contentColor={colors.inverseOnSurface}
            actionContentColor={colors.inversePrimary}
          />
        </SnackbarHost>
      </NativeHost>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // The strip spans the screen; only the snackbar in it takes presses.
    pointerEvents: 'box-none',
  },
});
