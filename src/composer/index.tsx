import type {ComposerProps} from './types';
import {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Platform, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Menu} from '../menu';
import {SEND, STOP} from '../glyphs';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {TextField} from '../text-field';
import {useTextValue} from '../text-field/shared';
import {useColor} from '../theme';
import {Footnote} from '../typography';

/** The capsule's height before the text wraps, in points: a line of 20, the field's 8 above and below it, and the capsule's 4. */
const MIN_HEIGHT = 44;

/**
 * Where a new notice is announced rather than left to a live region: iOS
 * has no live regions, and react-native-windows gives a view a live
 * setting but raises no event when its text changes, so Narrator would
 * not read it.
 */
const ANNOUNCES = Platform.OS === 'ios' || Platform.OS === 'windows';

/**
 * Has a screen reader read a new notice out: the error after a failed send
 * above all. On iOS the announcement is queued, so VoiceOver reads it once
 * it is done speaking, as a polite live region would. On Windows
 * react-native-windows drops the queue option and raises a UIA notification
 * that Narrator reads at once, a newer one replacing one not read yet. The
 * notice the composer mounts with is not read, as a live region's first text
 * is not. Android and web hear it through the live region around the line.
 */
function useAnnounced(notice: string | undefined) {
  const read = useRef(notice);
  useEffect(() => {
    if (notice === read.current) return;
    read.current = notice;
    if (ANNOUNCES && notice) AccessibilityInfo.announceForAccessibilityWithOptions(notice, {queue: true});
  }, [notice]);
}

/**
 * A capsule holding a bare field and a circle button, see
 * {@link ComposerProps}. Enter sends on web and a desktop keyboard and
 * Shift+Enter breaks the line, as the inline field reports them; the
 * keyboard's send key sends on a phone. While busy neither Enter nor the send
 * key sends, and the text stays. The button is in a host of its own,
 * since it sits in a React Native box wherever the composer is, inside a
 * sheet or not. On web the capsule draws the focus ring while the field has
 * the focus, since the bare field draws none; the touch platforms show no
 * ring, and Windows leaves the field to react-native-windows's own look. A
 * new notice is read out (`useAnnounced`).
 */
export function Composer({
  value,
  onChangeText,
  placeholder = 'Message',
  onSend,
  onStop,
  busy = false,
  notice,
  noticeColor = 'secondaryLabel',
  sendLabel = 'Send',
  stopLabel = 'Stop',
  sendIcon = SEND,
  stopIcon = STOP,
  onKeyPress,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  menu,
  disabled = false,
  autoFocus,
  ref,
  maxLength,
  testID,
  style,
}: ComposerProps) {
  const [text, setText] = useTextValue(value, onChangeText);
  const [focused, setFocused] = useState(false);
  const tint = useColor('tint');
  useAnnounced(notice);
  const ready = text.trim().length > 0;
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || busy) return;
    onSend(trimmed);
    if (value === undefined) setText('');
  };
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Surface
        color="element"
        radius="pill"
        style={[
          styles.capsule,
          menu ? styles.withMenu : null,
          Platform.OS === 'web' && focused ? [styles.focusRing, {outlineColor: tint}] : null,
        ]}
      >
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
          onKeyPress={onKeyPress}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          disabled={disabled}
          autoFocus={autoFocus}
          ref={ref}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.field}
          testID={testID ? `${testID}-field` : undefined}
        />
        <NativeHost fit style={styles.button}>
          {busy ? (
            <Button
              label={stopLabel}
              prefixIcon={stopIcon}
              hideLabel
              shape="circle"
              size="small"
              // Live whatever `disabled` says: a disabled composer can still stop what it runs.
              disabled={!onStop}
              onPress={onStop}
              testID={testID ? `${testID}-stop` : undefined}
            />
          ) : (
            <Button
              label={sendLabel}
              prefixIcon={sendIcon}
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
      {/*
        The live region stays mounted, so a notice that appears in it is read. React Native reads `aria-live` as
        `accessibilityLiveRegion`, which does not keep a view on its own: without `collapsable={false}` Fabric flattens
        the region away and TalkBack has no view to watch.
      */}
      <View aria-live={ANNOUNCES ? undefined : 'polite'} collapsable={ANNOUNCES ? undefined : false}>
        {notice !== undefined ? <Footnote color={noticeColor} style={styles.notice}>{notice}</Footnote> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
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
  // The web focus ring, as the SearchField draws it, in the tint.
  focusRing: {
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: -1,
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
  // The gap under the capsule goes with the notice: the empty live region takes no room.
  notice: {
    marginTop: 6,
    paddingHorizontal: 16,
  },
});

export type {ComposerProps} from './types';
