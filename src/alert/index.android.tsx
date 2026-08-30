import type {AlertProps} from './types';

import {AlertDialog, Column, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {Button} from '../button';
import {useColor} from '../theme';
import {DEFAULT_ACTIONS, splitActions} from './shared';

/**
 * Android renders the Material 3 `AlertDialog` while `visible`. The dialog
 * has two button slots: the `cancel` action takes the dismiss slot and the
 * remaining actions share the confirm slot as a row of text buttons (a
 * column with `sheet`, mirroring the stacked iOS action sheet). Buttons are
 * tinted with the live accent seed so they follow a user-supplied accent even
 * when the native host is not seeded.
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, children}: AlertProps) {
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const {cancel, others} = splitActions(actions);
  const Actions = sheet ? Column : Row;
  const press = (action: {onPress?: () => void}) => () => {
    action.onPress?.();
    onDismiss?.();
  };

  return (
    <>
      {children}
      {visible ? (
        <AlertDialog onDismissRequest={onDismiss} colors={{containerColor: colors.surfaceContainerHigh}}>
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
      ) : null}
    </>
  );
}
