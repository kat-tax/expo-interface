import type {LayoutChangeEvent} from 'react-native';
import type {CardGridProps} from './types';
import {useState} from 'react';
import {FlatList, StyleSheet, View, useWindowDimensions} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {ESTIMATED_CELL, GAP, MAX_COLUMNS, MIN_ITEM_WIDTH, columnsFor, rowsOf} from './shared';

/**
 * iOS, Android and Windows render React Native's `FlatList` a row of cells
 * at a time: windowed, so the rows off screen are not drawn, with the column
 * count worked out from the grid's measured width (the window's until the
 * first layout). A row is a flex row of equal cells with the gap between
 * them, and a last row short of cells keeps its cells the width of the
 * others.
 */
export function CardGrid<T>({
  data,
  renderItem,
  keyExtractor,
  minItemWidth = MIN_ITEM_WIDTH,
  maxColumns = MAX_COLUMNS,
  gap = GAP,
  header,
  footer,
  empty,
  onEndReached,
  estimatedItemHeight = ESTIMATED_CELL,
  contentInset,
  testID,
  style,
}: CardGridProps<T>) {
  const {width: windowWidth} = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const insets = useScrollInsets(contentInset);
  const columns = columnsFor(measured ?? windowWidth, minItemWidth, maxColumns, gap);
  const rows = rowsOf(data, columns);
  const onLayout = (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width);
  const rowHeight = estimatedItemHeight + gap;
  return (
    <FlatList
      // The rows are cut again when the columns change, which a FlatList only takes as a new list.
      key={columns}
      data={rows}
      renderItem={({item: row, index: rowIndex}) => (
        <View style={[styles.row, {gap}]}>
          {row.map((item, column) => (
            <View key={keyExtractor ? keyExtractor(item, rowIndex * columns + column) : String(rowIndex * columns + column)} style={styles.cell}>
              {renderItem(item, rowIndex * columns + column)}
            </View>
          ))}
          {row.length < columns ? Array.from({length: columns - row.length}, (_, filler) => <View key={`filler-${filler}`} style={styles.cell}/>) : null}
        </View>
      )}
      keyExtractor={(row, index) => keyExtractor ? keyExtractor(row[0]!, index * columns) : String(index)}
      ItemSeparatorComponent={() => <View style={{height: gap}}/>}
      ListHeaderComponent={header ? <>{header}</> : undefined}
      ListFooterComponent={footer ? <>{footer}</> : undefined}
      ListEmptyComponent={empty ? <>{empty}</> : undefined}
      onEndReached={onEndReached}
      getItemLayout={(_, index) => ({length: rowHeight, offset: rowHeight * index, index})}
      contentContainerStyle={{paddingTop: insets.top, paddingBottom: insets.bottom}}
      scrollIndicatorInsets={{top: insets.top, bottom: insets.bottom}}
      // iOS under a header the screen runs under: UIKit's own inset, which follows a native search bar.
      contentInsetAdjustmentBehavior={insets.automatic ? 'automatic' : undefined}
      onLayout={onLayout}
      style={[styles.grid, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  grid: {flex: 1, alignSelf: 'stretch'},
  row: {flexDirection: 'row', alignItems: 'stretch'},
  cell: {flex: 1, minWidth: 0},
});

export type {CardGridProps} from './types';
