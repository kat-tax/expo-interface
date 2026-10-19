import type {FindBarMatches, FindBarProps} from './types';
import {useEffect, useRef} from 'react';
import {AccessibilityInfo, Platform, StyleSheet, View} from 'react-native';
import {CLOSE, NEXT, PREVIOUS} from '../glyphs';
import {TextField} from '../text-field';
import {useTextValue} from '../text-field/shared';
import {Toolbar} from '../toolbar';
import {Footnote} from '../typography';
import {spacing} from '../theme';

/**
 * Where a new count is announced rather than left to a live region, as the
 * composer announces its notice: iOS has no live regions, and
 * react-native-windows gives a view a live setting but raises no event when
 * its text changes, so Narrator would not read it.
 */
const ANNOUNCES = Platform.OS === 'ios' || Platform.OS === 'windows';

/**
 * The live region the count sits in where a screen reader hears one, on
 * Android and the web. Not collapsable: Fabric flattens a view whose only
 * trait is its live region, and TalkBack has no view to watch.
 */
const LIVE = ANNOUNCES ? {} : {'aria-live': 'polite', accessibilityLiveRegion: 'polite', collapsable: false} as const;

/**
 * Has a screen reader read a new count out on iOS and Windows. On iOS the
 * announcement is queued, so VoiceOver reads it once it is done speaking, as
 * a polite live region would; on Windows react-native-windows drops the
 * queue option and raises a UIA notification that Narrator reads at once, a
 * newer one replacing one not read yet. The count the bar opens with is not
 * read, as a live region's first text is not, and a count going away says
 * nothing.
 */
function useAnnounced(label: string | null) {
  const read = useRef(label);
  useEffect(() => {
    if (label === read.current) return;
    read.current = label;
    if (ANNOUNCES && label) AccessibilityInfo.announceForAccessibilityWithOptions(label, {queue: true});
  }, [label]);
}

/** What the count says: where the find has got to, that there is nothing, or nothing before it has looked. */
export function matchLabel(matches: FindBarMatches | null | undefined, text: string): string | null {
  if (!matches || text === '') return null;
  return matches.total === 0 ? 'No matches' : `${matches.current} of ${matches.total}`;
}

/**
 * A find bar (see {@link FindBarProps}): the kit's `Toolbar` with an inline
 * field and the count beside it, and previous, next and close as the field's
 * commands, in the bar's one trailing host. The keyboard's search key and
 * Enter go to the next match, Shift+Enter to the previous, Escape closes.
 * The count is a polite live region on Android and the web, and announced
 * on iOS and Windows (`useAnnounced`), so a screen reader hears it change.
 */
export function FindBar({value, onChangeText, placeholder = 'Find', matches, onNext, onPrevious, onClose, autoFocus = true, placement = 'top', testID, style}: FindBarProps) {
  const [text, setText] = useTextValue(value, onChangeText);
  const label = matchLabel(matches, text);
  useAnnounced(label);
  const none = !matches || matches.total === 0;
  return (
    <Toolbar
      placement={placement}
      density="compact"
      style={style}
      testID={testID}
      field={
        <View style={styles.field}>
          <View style={styles.input}>
            <TextField
              variant="inline"
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              autoFocus={autoFocus}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              submitBehavior="submit"
              onSubmit={() => onNext?.()}
              onKeyPress={(key, shift) => {
                if (key === 'Enter' && shift) onPrevious?.();
                else if (key === 'Escape') onClose?.();
              }}
              testID={testID ? `${testID}-field` : undefined}
            />
          </View>
          <View {...LIVE}>
            {label ? <Footnote color="secondaryLabel" numberOfLines={1} testID={testID ? `${testID}-count` : undefined}>{label}</Footnote> : null}
          </View>
        </View>
      }
      fieldCommands={[
        {label: 'Previous match', icon: PREVIOUS, hideLabel: true, tone: 'label', disabled: none, onPress: onPrevious, testID: testID ? `${testID}-previous` : undefined},
        {label: 'Next match', icon: NEXT, hideLabel: true, tone: 'label', disabled: none, onPress: onNext, testID: testID ? `${testID}-next` : undefined},
        {label: 'Close', icon: CLOSE, hideLabel: true, tone: 'label', onPress: onClose, testID: testID ? `${testID}-close` : undefined},
      ]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
  input: {
    flex: 1,
    minWidth: 0,
  },
});

export type {FindBarMatches, FindBarProps} from './types';
