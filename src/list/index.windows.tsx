import type {ListProps} from './types';
import {FlatList, StyleSheet, View} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {useColor} from '../theme';
import {ESTIMATED_ROW, keyOf} from './shared';

/**
 * Windows renders React Native's `FlatList`: windowed, so the rows off
 * screen are not drawn, with a hairline in the separator color between the
 * rows. The rows are the kit's `ListItem`s, drawn in React Native here, so
 * a row may hold anything.
 */
export function List<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, estimatedItemHeight = ESTIMATED_ROW, contentInset, testID, style}: ListProps<T>) {
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
      getItemLayout={(_, index) => ({length: estimatedItemHeight, offset: estimatedItemHeight * index, index})}
      contentContainerStyle={{paddingTop: insets.top, paddingBottom: insets.bottom}}
      style={[styles.list, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1, alignSelf: 'stretch'},
  separator: {height: StyleSheet.hairlineWidth},
});

export type {ListProps} from './types';
