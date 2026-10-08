import type {ComposerProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Menu} from '../menu';
import {SEND, STOP} from '../glyphs';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {TextField} from '../text-field';
import {useTextValue} from '../text-field/shared';
import {Footnote} from '../typography';

/** The capsule's height before the text wraps, in points. */
const MIN_HEIGHT = 44;

/**
 * A capsule holding a bare field and a circle button, see
 * {@link ComposerProps}. Enter sends on web and a desktop keyboard and
 * Shift+Enter breaks the line, as the inline field reports them; the
 * keyboard's send key sends on a phone. While busy neither Enter nor the send
 * key sends, and the text stays. The button is in a host of its own,
 * since it sits in a React Native box wherever the composer is, inside a
 * sheet or not.
 */
export function Composer({
  value,
  onChangeText,
  placeholder = 'Message',
  onSend,
  onStop,
  busy = false,
  notice,
  menu,
  disabled = false,
  autoFocus,
  maxLength,
  testID,
  style,
}: ComposerProps) {
  const [text, setText] = useTextValue(value, onChangeText);
  const ready = text.trim().length > 0;
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || busy) return;
    onSend(trimmed);
    if (value === undefined) setText('');
  };
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Surface color="element" radius="pill" style={[styles.capsule, menu ? styles.withMenu : null]}>
        {menu ? (
          <NativeHost fit style={styles.button}>
            <Menu
              label={menu.label}
              icon={menu.icon}
              hideLabel
              variant="text"
              tone="label"
              size="small"
              items={menu.items}
              disabled={disabled}
              testID={testID ? `${testID}-menu` : undefined}
            />
          </NativeHost>
        ) : null}
        <TextField
          variant="bare"
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          multiline
          returnKeyType="send"
          submitBehavior="submit"
          onSubmit={send}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          style={styles.field}
          testID={testID ? `${testID}-field` : undefined}
        />
        <NativeHost fit style={styles.button}>
          {busy ? (
            <Button
              label="Stop"
              prefixIcon={STOP}
              hideLabel
              shape="circle"
              size="small"
              disabled={disabled || !onStop}
              onPress={onStop}
              testID={testID ? `${testID}-stop` : undefined}
            />
          ) : (
            <Button
              label="Send"
              prefixIcon={SEND}
              hideLabel
              shape="circle"
              size="small"
              disabled={disabled || !ready}
              onPress={send}
              testID={testID ? `${testID}-send` : undefined}
            />
          )}
        </NativeHost>
      </Surface>
      {notice !== undefined ? <Footnote color="secondaryLabel" style={styles.notice}>{notice}</Footnote> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 6,
  },
  capsule: {
    minHeight: MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  // The menu's button sits where the field's leading padding would.
  withMenu: {
    paddingLeft: 4,
  },
  field: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
    maxHeight: 120,
  },
  button: {
    marginBottom: 2,
  },
  notice: {
    paddingHorizontal: 16,
  },
});

export type {ComposerProps} from './types';
