import './alert.css';
import type {SyntheticEvent} from 'react';
import type {AlertProps} from './types';
import {useEffect, useRef} from 'react';
import {Button} from '../button';
import {materialAttributes} from '../material';
import {useOverlayMaterial} from '../material/context';
import {useEscape} from '../popover/shared';
import {TextField} from '../text-field';
import {Body, Headline} from '../typography';
import {DEFAULT_ACTIONS, defaultAction, splitActions} from './shared';

/**
 * On web the alert is a real `<dialog>` opened with `showModal()`, so it sits
 * in the top layer with a backdrop, traps focus, and closes on Escape. The
 * kit takes the Escape itself, so the key goes no further: a web `Sheet`
 * the alert opened from stays up.
 * Actions render as the kit's text buttons; `sheet` anchors the dialog to
 * the bottom edge with the actions stacked, like an iOS action sheet. A
 * disabled action is a disabled `<button>`, which the dialog's first focus
 * passes over. A field goes under the message, and Enter in it presses the
 * first action that is not the cancel, unless that action is disabled.
 * On a material the dialog carries the attributes `material.css` draws the
 * bar's glass from, and its own fill and shadow give way (`alert.css`).
 */
export function Alert({title, message, visible, onDismiss, actions = DEFAULT_ACTIONS, sheet, input, material, children, testID}: AlertProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const glass = useOverlayMaterial(material);
  // Set while the app closes the dialog by clearing `visible`: that close is not reported.
  const silent = useRef(false);
  const {cancel, others} = splitActions(actions);
  const submit = () => {
    const action = defaultAction(actions);
    if (!action) return;
    action.onPress?.();
    ref.current?.close();
  };

  useEffect(() => {
    const dialog = ref.current!;
    if (visible && !dialog.open) {
      dialog.showModal();
    } else if (!visible && dialog.open) {
      silent.current = true;
      dialog.close();
    }
  }, [visible]);

  // Escape closes the alert alone: the key is taken at the window and goes
  // no further, so a web `Sheet` the alert opened from stays up. The close
  // is reported through the dialog's close event, as an action's is.
  useEscape(visible, ref, () => ref.current?.close());

  // The dialog's close event, after an action, Escape or a backdrop click,
  // and after the app's own close, which is not reported.
  const onClose = () => {
    if (silent.current) {
      silent.current = false;
      return;
    }
    onDismiss?.();
  };

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
        onClose={onClose}
        onClick={onBackdrop}
        data-testid={testID}
        {...materialAttributes(glass, 'element', 'float')}>
        <div className="ui-alert__body">
          <Headline testID={testID ? `${testID}-title` : undefined}>{title}</Headline>
          {message ? <Body color="secondaryLabel">{message}</Body> : null}
          {input && !sheet ? (
            <div className="ui-alert__field">
              {/* Enter keeps the focus in the field: the alert closes on a press, and a disabled action leaves the user typing. */}
              <TextField
                variant="bare"
                placeholder={input.placeholder}
                value={input.value}
                onChangeText={input.onChangeText}
                secureTextEntry={input.secureTextEntry}
                keyboardType={input.keyboardType}
                autoCapitalize={input.autoCapitalize}
                autoCorrect={input.autoCorrect}
                autoFocus={input.autoFocus ?? true}
                submitBehavior="submit"
                onSubmit={submit}
                testID={input.testID}
              />
            </div>
          ) : null}
        </div>
        <div className="ui-alert__actions">
          {[...others, ...(cancel ? [cancel] : [])].map((action, index) => (
            <Button
              key={index}
              label={action.label}
              variant={sheet ? 'outlined' : 'text'}
              role={action.role === 'destructive' ? 'destructive' : 'default'}
              disabled={action.disabled}
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
