import type {AlertProps} from './types';
import {useId} from 'react';
import {StyleSheet} from 'react-native';
import XamlContentDialog from '../windows/specs/ExpoInterfaceContentDialogNativeComponent';
import {Portal} from '../windows/portal';
import {jsonProp, useXamlProps} from '../windows';
import {TextField} from '../text-field';
import {DEFAULT_ACTIONS, defaultAction} from './shared';

/**
 * Windows presents a dialog in WinUI's `ContentDialog` arrangement — smoke
 * over the whole window, the title, the message and the actions as the
 * dialog's buttons (the cancel action closes it) — drawn by the native
 * library in a windowed popup from a zero-size island that can sit anywhere
 * in a React Native layout, so the alert needs no host. `sheet` has no
 * Windows form; a dialog is drawn either way. The trigger, if any, renders
 * in place. A disabled action's button is disabled, and Escape with a
 * disabled cancel only dismisses. A field is the kit's `TextBox` in the
 * dialog's body, placed there through a portal naming the body's slot, and
 * Enter in it presses the first action that is not the cancel, unless that
 * action is disabled.
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, input, children, testID}: AlertProps) {
  const xaml = useXamlProps();
  const slot = useId();
  const field = input && !sheet ? input : undefined;
  const submit = () => {
    const action = defaultAction(actions);
    if (!action) return;
    action.onPress?.();
    onDismiss?.();
  };
  return (
    <>
      {children}
      <XamlContentDialog
        open={visible}
        title={title}
        message={message}
        actions={jsonProp(actions.map(action => ({label: action.label, role: action.role ?? 'default', ...(action.disabled ? {disabled: true} : null)})))}
        slot={field ? slot : undefined}
        onClose={event => {
          const action = actions[event.nativeEvent.index];
          if (!action?.disabled) action?.onPress?.();
          onDismiss?.();
        }}
        style={styles.anchor}
        testID={testID}
        {...xaml}
      />
      {field ? (
        <Portal slot={slot}>
          <TextField
            placeholder={field.placeholder}
            value={field.value}
            onChangeText={field.onChangeText}
            secureTextEntry={field.secureTextEntry}
            keyboardType={field.keyboardType}
            autoCapitalize={field.autoCapitalize}
            autoCorrect={field.autoCorrect}
            autoFocus={field.autoFocus ?? true}
            onSubmit={submit}
            testID={field.testID}
          />
        </Portal>
      ) : null}
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
