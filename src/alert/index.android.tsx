import type {AlertProps} from './types';

import {StyleSheet} from 'react-native';
import {AlertDialog, Column, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {Button} from '../button';
import {NativeHost, useNativeHost} from '../host';
import {useColor} from '../theme';
import {DEFAULT_ACTIONS, splitActions} from './shared';

/**
 * A Compose `AlertDialog` has to be a direct child of a host. Outside one
 * the dialog gets a host of its own — an empty overlay, since Compose
 * presents the dialog in its own window — so a confirmation can be rendered
 * anywhere in a React Native layout. `children` stays in the tree it was
 * given either way.
 */
export function Alert({children, ...props}: AlertProps) {
  const hosted = useNativeHost();
  if (hosted) return <>{children}<AlertDialogView {...props}/></>;
  return (
    <>
      {children}
      <NativeHost style={styles.overlay} pointerEvents="none">
        <AlertDialogView {...props}/>
      </NativeHost>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {position: 'absolute'},
});

/**
 * Android renders the Material 3 `AlertDialog` while `visible`. The dialog
 * has two button slots: the `cancel` action takes the dismiss slot and the
 * remaining actions share the confirm slot as a row of text buttons (a
 * column with `sheet`, mirroring the stacked iOS action sheet). Buttons are
 * tinted with the live accent seed so they follow a user-supplied accent even
 * when the native host is not seeded.
 */
function AlertDialogView({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, testID}: AlertProps) {
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const {cancel, others} = splitActions(actions);
  const Actions = sheet ? Column : Row;
  const press = (action: {onPress?: () => void}) => () => {
    action.onPress?.();
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <AlertDialog
      onDismissRequest={onDismiss}
      colors={{containerColor: colors.surfaceContainerHigh}}
      modifiers={testID ? [testIDModifier(testID)] : undefined}>
      <AlertDialog.Title>
        <Text color={colors.onSurface} style={{typography: 'headlineSmall'}}>{title}</Text>
      </AlertDialog.Title>
      {message ? (
        <AlertDialog.Text>
          <Text color={colors.onSurfaceVariant} style={{typography: 'bodyMedium'}}>{message}</Text>
        </AlertDialog.Text>
      ) : null}
      {others.length > 0 ? (
        <AlertDialog.ConfirmButton>
          <Actions>
            {others.map((action, index) => (
              <Button
                key={index}
                label={action.label}
                variant="text"
                color={action.role === 'destructive' ? undefined : tint}
                role={action.role === 'destructive' ? 'destructive' : 'default'}
                onPress={press(action)}
              />
            ))}
          </Actions>
        </AlertDialog.ConfirmButton>
      ) : null}
      {cancel ? (
        <AlertDialog.DismissButton>
          <Button label={cancel.label} variant="text" color={tint} onPress={press(cancel)}/>
        </AlertDialog.DismissButton>
      ) : null}
    </AlertDialog>
  );
}
