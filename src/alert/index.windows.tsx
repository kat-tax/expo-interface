import type {AlertProps} from './types';
import {StyleSheet} from 'react-native';
import XamlContentDialog from '../windows/specs/ExpoInterfaceContentDialogNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {DEFAULT_ACTIONS} from './shared';

/**
 * Windows presents a dialog in WinUI's `ContentDialog` arrangement — smoke
 * over the whole window, the title, the message and the actions as the
 * dialog's buttons (the cancel action closes it) — drawn by the native
 * library in a windowed popup from a zero-size island that can sit anywhere
 * in a React Native layout, so the alert needs no host. `sheet` has no
 * Windows form; a dialog is drawn either way. The trigger, if any, renders
 * in place.
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, children, testID}: AlertProps) {
  const xaml = useXamlProps();
  return (
    <>
      {children}
      <XamlContentDialog
        open={visible}
        title={title}
        message={message}
        actions={jsonProp(actions.map(action => ({label: action.label, role: action.role ?? 'default'})))}
        onClose={event => {
          const action = actions[event.nativeEvent.index];
          action?.onPress?.();
          onDismiss?.();
        }}
        style={styles.anchor}
        testID={testID}
        {...xaml}
      />
    </>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});
