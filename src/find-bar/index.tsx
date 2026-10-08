import type {FindBarMatches, FindBarProps} from './types';
import {StyleSheet, View} from 'react-native';
import {CLOSE, NEXT, PREVIOUS} from '../glyphs';
import {TextField} from '../text-field';
import {useTextValue} from '../text-field/shared';
import {Toolbar} from '../toolbar';
import {Footnote} from '../typography';
import {spacing} from '../theme';

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
 * The count is a polite live region, so a screen reader hears it change.
 */
export function FindBar({value, onChangeText, placeholder = 'Find', matches, onNext, onPrevious, onClose, autoFocus = true, placement = 'top', testID, style}: FindBarProps) {
  const [text, setText] = useTextValue(value, onChangeText);
  const label = matchLabel(matches, text);
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
          {/* Not collapsable: Fabric flattens a view whose only trait is its live region, and TalkBack has no view to watch. */}
          <View aria-live="polite" accessibilityLiveRegion="polite" collapsable={false}>
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
