import type {InlineFieldProps} from './shared';
import {StyleSheet, View} from 'react-native';
import {SearchField} from '../search-field';
import {INLINE_WIDTH} from './shared';

/**
 * The field beside the title where the platform's own search box is the
 * look: Windows' `AutoSuggestBox`, at a desktop search box's width. The web
 * draws its own in `inline.web.tsx`.
 */
export function InlineField({shortPlaceholder: _short, ...props}: InlineFieldProps) {
  return (
    <View style={styles.inline}>
      <SearchField {...props}/>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    width: INLINE_WIDTH,
    maxWidth: '100%',
  },
});
