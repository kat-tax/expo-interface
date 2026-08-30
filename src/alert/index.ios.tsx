import type {AlertProps} from './types';

import {Alert as SwiftUIAlert, Button, ConfirmationDialog, Spacer, Text} from '@expo/ui/swift-ui';
import {frame} from '@expo/ui/swift-ui/modifiers';
import {DEFAULT_ACTIONS} from './shared';

/**
 * iOS renders SwiftUI's `Alert`, or `ConfirmationDialog` (the action sheet)
 * with `sheet`. SwiftUI presents from a view in the hierarchy, so the trigger
 * slot holds `children` or, when none is given, a zero-size `Spacer` anchor.
 * Action buttons carry their SwiftUI role (`cancel` bold / `destructive` red)
 * and dismiss automatically; the presented-state change then reports
 * `onDismiss`.
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, children, testID}: AlertProps) {
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
