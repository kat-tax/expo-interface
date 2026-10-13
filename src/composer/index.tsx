import type {ComposerProps} from './types';
import type {TextStyle, ViewStyle} from 'react-native';
import type {NativeHostFit} from '../host';
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
import {useToolbarControlHeight} from '../toolbar/field-context';
import {Footnote} from '../typography';

/** The field's line, in points. */
const LINE_HEIGHT = 20;

/**
 * The capsule's height before the text wraps, in points: a line of 20, the
 * field's 8 above and below it, and the capsule's 4. As a `Toolbar`'s field
 * the capsule is the height of the bar's controls where that is shorter
 * (`useToolbarControlHeight`: the web's small buttons are 30, Windows's 24),
 * closing its own padding, with the field's alone centring the line, and the
 * buttons, as tall as the capsule then, filling its round ends with no
 * padding or margin around them.
 */
const MIN_HEIGHT = 44;

/** The capsule's own padding above and below its content. */
const CAPSULE_PADDING = 4;

/**
 * The buttons' hosts on Android: a box of the room one line leaves inside
 * the capsule's padding, 36. Material's icon button is a 40dp container in
 * a 48dp touch target (`minimumInteractiveComponentSize`, which the
 * `MaterialTheme` in `@expo/ui`'s host applies), and a host sized to its
 * content takes the 48, so the row grows to it: 48 and the capsule's 4
 * above and below is 56, with the field at the bottom of it and its line 6
 * below the middle. Compose's `size` keeps to the room it is measured in,
 * so in a box of 36 the button is drawn as a 36 circle centred on the line,
 * and the capsule stays 44. The touch target is the circle, as it is on the
 * other platforms.
 */
const ANDROID_BUTTON_BOX = MIN_HEIGHT - 2 * CAPSULE_PADDING;

/**
 * The button the capsule centres in its round end, in points: the kit's
 * small circle button, 30 on the web (a 16 glyph, 6 of padding and a 1 px
 * border each side) and on iOS, the small button island's 24 on Windows,
 * and on Android the box its host is. The capsule's padding at that end is
 * half of what the button leaves of the capsule's one-line height, so the
 * button is as far from the end as from the top and the bottom; its margin
 * centres it on the last line, which keeps it there as the text wraps.
 */
const BUTTON_SIZE = Platform.OS === 'android' ? ANDROID_BUTTON_BOX : Platform.OS === 'windows' ? 24 : 30;

/** The hosts take the size the layout gives on Android, and the button's own size elsewhere. */
const BUTTON_FIT: NativeHostFit = Platform.OS === 'android' ? 'fill' : true;

/**
 * The buttons' hosts: a box of `ANDROID_BUTTON_BOX` at the bottom of the row
 * on Android, and the button's own size elsewhere. The margin that puts them
 * on the last line comes from `BUTTON_SIZE` and the field's padding.
 */
const BUTTON: ViewStyle = Platform.OS === 'android'
  ? {width: ANDROID_BUTTON_BOX, height: ANDROID_BUTTON_BOX, flex: 0, alignSelf: 'flex-end'}
  : {};

/**
 * The field's Android metrics. The line is measured through its
 * `lineHeight` whatever the font's padding, but an `EditText` lays its
 * placeholder out without the `lineHeight`: with the font's padding
 * (`includeFontPadding`, on by default) the placeholder's box is the font's
 * top to bottom, 19.9 for Roboto at 15sp, and its baseline sits 0.7 below
 * the typed text's; without it the box is ascent to descent, 17.6, and
 * centred in the line of 20 its baseline is the text's own. The text is
 * centred in the field itself (`textAlignVertical`), whatever the app
 * theme's `EditText` style says.
 */
const ANDROID_FIELD: TextStyle = Platform.OS === 'android' ? {includeFontPadding: false, textAlignVertical: 'center'} : {};

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
  // In a bar whose controls are shorter than the capsule, the capsule is
  // their height: its own padding closes, the field's centres the line.
  const controls = useToolbarControlHeight();
  const height = controls !== undefined && controls < MIN_HEIGHT ? controls : MIN_HEIGHT;
  const capsulePadding = height < MIN_HEIGHT ? 0 : CAPSULE_PADDING;
  const fieldPadding = (height - 2 * capsulePadding - LINE_HEIGHT) / 2;
  // The button in the capsule's round end: as far from the end as from the
  // top and the bottom of one line's capsule, and centred on the last line.
  // Both are 0 in a capsule the height of a bar's controls, the button's own.
  const endPadding = (height - BUTTON_SIZE) / 2;
  const button = [styles.button, {marginBottom: (LINE_HEIGHT + 2 * fieldPadding - BUTTON_SIZE) / 2}];
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
          {minHeight: height, paddingVertical: capsulePadding, paddingRight: endPadding},
          // The menu's button sits in the leading end, where the field's own padding would be.
          menu ? {paddingLeft: endPadding} : null,
          Platform.OS === 'web' && focused ? [styles.focusRing, {outlineColor: tint}] : null,
        ]}
      >
        {menu ? (
          <NativeHost fit={BUTTON_FIT} style={button}>
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
          style={[styles.field, {paddingVertical: fieldPadding}]}
          testID={testID ? `${testID}-field` : undefined}
        />
        <NativeHost fit={BUTTON_FIT} style={button}>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    gap: 8,
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
    lineHeight: LINE_HEIGHT,
    maxHeight: 120,
    ...ANDROID_FIELD,
  },
  button: BUTTON,
  // The gap under the capsule goes with the notice: the empty live region takes no room.
  notice: {
    marginTop: 6,
    paddingHorizontal: 16,
  },
});

export type {ComposerProps} from './types';
