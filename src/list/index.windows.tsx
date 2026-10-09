import type {ListProps} from './types';
import {FlatList, StyleSheet, View} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {useColor} from '../theme';
import {keyOf} from './shared';

/**
 * Windows renders React Native's `FlatList`: windowed and measured as it
 * draws, so the rows off screen are not drawn and the rows it draws are the
 * rows on screen whatever their height, with a hairline in the separator
 * color between the rows. The rows are the kit's `ListItem`s, drawn in React
 * Native here, so a row may hold anything. A tap on a row reaches it while a
 * field has the touch keyboard (`keyboardShouldPersistTaps="handled"`), and
 * while the list is empty its content grows to the list's height, which an
 * `EmptyState` fills.
 */
export function List<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset, testID, style}: ListProps<T>) {
  const separator = useColor('separator');
  const insets = useScrollInsets(contentInset);
  return (
    <FlatList
      data={data}
      renderItem={({item, index}) => <>{renderItem(item, index)}</>}
      keyExtractor={(item, index) => keyOf({keyExtractor}, item, index)}
      ItemSeparatorComponent={separators ? () => <View style={[styles.separator, {backgroundColor: separator}]}/> : undefined}
      ListHeaderComponent={header ? <>{header}</> : undefined}
      ListFooterComponent={footer ? <>{footer}</> : undefined}
      ListEmptyComponent={empty ? <>{empty}</> : undefined}
      onEndReached={onEndReached}
      // A tap on a row goes to the row while a field has the touch keyboard; a tap past the rows closes it.
      keyboardShouldPersistTaps="handled"
      // While empty the content grows to the list's height, so an `EmptyState` fills it under the header.
      contentContainerStyle={[{paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right}, data.length === 0 ? styles.grow : null]}
      style={[styles.list, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1, alignSelf: 'stretch'},
  separator: {height: StyleSheet.hairlineWidth},
  grow: {flexGrow: 1},
});

export type {ListProps} from './types';
