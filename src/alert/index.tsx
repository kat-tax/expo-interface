import './alert.css';
import type {SyntheticEvent} from 'react';
import type {AlertProps} from './types';
import {useEffect, useRef} from 'react';
import {Button} from '../button';
import {Body, Headline} from '../typography';
import {DEFAULT_ACTIONS, splitActions} from './shared';

/**
 * On web the alert is a real `<dialog>` opened with `showModal()`, so it sits
 * in the top layer with a backdrop, traps focus, and closes on Escape.
 * Actions render as the kit's text buttons; `sheet` anchors the dialog to
 * the bottom edge with the actions stacked, like an iOS action sheet.
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, children, testID}: AlertProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const {cancel, others} = splitActions(actions);

  useEffect(() => {
    const dialog = ref.current!;
    if (visible && !dialog.open) dialog.showModal();
    else if (!visible && dialog.open) dialog.close();
  }, [visible]);

  const onBackdrop = (event: SyntheticEvent<HTMLDialogElement, MouseEvent>) => {
    if (event.target === ref.current) ref.current?.close();
  };

  return (
    <>
      {children}
      <dialog
        ref={ref}
        className={['ui-alert', sheet && 'ui-alert--sheet'].filter(Boolean).join(' ')}
        aria-label={title}
        onClose={onDismiss}
        onClick={onBackdrop}
        data-testid={testID}>
        <div className="ui-alert__body">
          <Headline testID={testID ? `${testID}-title` : undefined}>{title}</Headline>
          {message ? <Body color="secondaryLabel">{message}</Body> : null}
        </div>
        <div className="ui-alert__actions">
          {[...others, ...(cancel ? [cancel] : [])].map((action, index) => (
            <Button
              key={index}
              label={action.label}
              variant={sheet ? 'outlined' : 'text'}
              role={action.role === 'destructive' ? 'destructive' : 'default'}
              onPress={() => {
                action.onPress?.();
                ref.current?.close();
              }}
            />
          ))}
        </div>
      </dialog>
    </>
  );
}
