import type {ToastProps} from './types';
import {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlInfoBar from '../windows/specs/ExpoInterfaceInfoBarNativeComponent';
import {useXamlProps} from '../windows';
import {spacing} from '../theme';
import {TOAST_DURATION} from './types';

/**
 * Windows shows a WinUI 3 `InfoBar` — the platform's own strip for a brief
 * message, with an action button and a close button — over the bottom of
 * the screen, timed by the kit as the drawn toast is elsewhere.
 */
export function Toast({message, visible, action, onDismiss, duration = TOAST_DURATION, testID}: ToastProps) {
  const xaml = useXamlProps();
  useEffect(() => {
    if (!visible || !onDismiss || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.slot}>
      <XamlInfoBar
        message={message}
        actionLabel={action?.label}
        closable={!!onDismiss}
        onAction={action ? () => {
          action.onPress();
          onDismiss?.();
        } : undefined}
        onClose={onDismiss ? () => onDismiss() : undefined}
        style={styles.bar}
        testID={testID}
        {...xaml}
      />
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
    // The strip spans the screen; only the bar in it takes presses.
    pointerEvents: 'box-none',
  },
  bar: {
    maxWidth: '90%',
    minWidth: 320,
  },
});
