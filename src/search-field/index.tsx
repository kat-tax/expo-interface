import type {SearchFieldProps} from './types';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SymbolView} from 'expo-symbols';
import {Surface} from '../surface';
import {TextField} from '../text-field';
import {spacing, useColor} from '../theme';
import {SEARCH_LABEL, canClear, matchingSuggestions} from './shared';

const ICON = 18;
const SEARCH = {ios: 'magnifyingglass', android: 'search', web: 'search'} as const;
const CLEAR = {ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel'} as const;

/**
 * iOS and Android draw the search field from the kit's own pieces: a rounded
 * row with a magnifier, the kit's `TextField` inside it, a clear button, and
 * the completions under it.
 *
 * Android is composed rather than native on purpose. Compose's `SearchBar` and
 * `DockedSearchBar` take an `onQueryChange` and no `query`, so nothing outside
 * them can set or clear the text they hold. Every other input in this kit is
 * controlled, and the alternative — a `value` prop that silently does nothing
 * on one platform — is the failure this kit exists to avoid.
 */
export function SearchField(props: SearchFieldProps) {
  const {value, onChangeText, onSubmit, placeholder, suggestions, disabled, testID, style} = props;
  const muted = useColor('secondaryLabel');
  const ink = useColor('label');
  const label = placeholder ?? SEARCH_LABEL;
  // The text decides whether the list is open, not the focus: `TextField` has
  // no focus callbacks, and tying it to the text means the list closes when a
  // suggestion is taken or the box is cleared, which is when it should.
  const matches = matchingSuggestions(value, suggestions);
  return (
    <View style={style} testID={testID ? `${testID}-row` : undefined}>
      <Surface color="element" border="all" padding={spacing.two} style={styles.row}>
        <SymbolView name={SEARCH} size={ICON} tintColor={muted}/>
        <View style={styles.field}>
          <TextField
            variant="inline"
            value={value}
            placeholder={label}
            onChangeText={onChangeText}
            onSubmit={onSubmit}
            disabled={disabled}
            autoCorrect={false}
            returnKeyType="search"
            testID={testID}
          />
        </View>
        {canClear(props) ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} testID={testID ? `${testID}-clear` : undefined}>
            <SymbolView name={CLEAR} size={ICON} tintColor={muted}/>
          </Pressable>
        ) : null}
      </Surface>
      {matches.length > 0 ? (
        <Surface raised border="all" style={styles.list} testID={testID ? `${testID}-suggestions` : undefined}>
          {matches.map(suggestion => (
            <Pressable
              key={suggestion}
              accessibilityRole="button"
              style={styles.suggestion}
              onPress={() => {
                onChangeText(suggestion);
                onSubmit?.(suggestion);
              }}>
              <Text style={[styles.suggestionText, {color: ink}]}>{suggestion}</Text>
            </Pressable>
          ))}
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
  field: {
    flex: 1,
  },
  list: {
    marginTop: spacing.one,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
  },
  suggestionText: {
    fontSize: 15,
  },
});
