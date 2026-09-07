import type {AlertProps} from './types';

import {StyleSheet} from 'react-native';
import {Alert as SwiftUIAlert, Button, ConfirmationDialog, Spacer, Text} from '@expo/ui/swift-ui';
import {frame} from '@expo/ui/swift-ui/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {DEFAULT_ACTIONS} from './shared';

/**
 * SwiftUI presents from a view in the hierarchy, which has to be inside a
 * host. Outside one the alert mounts its own, so a confirmation can be
 * rendered anywhere in a React Native layout: sized to the trigger when
 * there is one, an empty overlay when there is not.
 */
export function Alert(props: AlertProps) {
  const hosted = useNativeHost();
  if (hosted) return <SwiftUIAlertView {...props}/>;
  return (
    <NativeHost
      fit
      style={props.children ? undefined : styles.overlay}
      pointerEvents={props.children ? undefined : 'none'}>
      <SwiftUIAlertView {...props}/>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  overlay: {position: 'absolute'},
});

/**
 * iOS renders SwiftUI's `Alert`, or `ConfirmationDialog` (the action sheet)
 * with `sheet`. SwiftUI presents from a view in the hierarchy, so the trigger
 * slot holds `children` or, when none is given, a zero-size `Spacer` anchor.
 * Action buttons carry their SwiftUI role (`cancel` bold / `destructive` red)
 * and dismiss automatically; the presented-state change then reports
 * `onDismiss`.
 */
function SwiftUIAlertView({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, children, testID}: AlertProps) {
  const Component = sheet ? ConfirmationDialog : SwiftUIAlert;
  const onPresentedChange = (presented: boolean) => {
    if (!presented) onDismiss?.();
  };
  return (
    <Component
      title={title}
      isPresented={visible}
      onIsPresentedChange={onPresentedChange}
      testID={testID}
      {...(sheet ? {titleVisibility: 'visible' as const} : null)}>
      <Component.Trigger>
        {children ?? <Spacer modifiers={[frame({width: 0, height: 0})]}/>}
      </Component.Trigger>
      {message ? (
        <Component.Message>
          <Text>{message}</Text>
        </Component.Message>
      ) : null}
      <Component.Actions>
        {actions.map((action, index) => (
          <Button
            key={index}
            label={action.label}
            role={action.role ?? 'default'}
            onPress={action.onPress}
          />
        ))}
      </Component.Actions>
    </Component>
  );
}
