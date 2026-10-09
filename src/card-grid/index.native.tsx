import type {LayoutChangeEvent} from 'react-native';
import type {CardGridProps} from './types';
import {createContext, useContext, useState} from 'react';
import {FlatList, StyleSheet, View, useWindowDimensions} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {GAP, MAX_COLUMNS, MIN_ITEM_WIDTH, columnsFor, rowsOf} from './shared';

/** The gap between the rows, for the separator the list draws between them. */
const GapContext = createContext(GAP);

/**
 * The space between two rows. One component for the grid's life, since the
 * list mounts every separator again when it is handed a new component type:
 * the gap reaches it through the context rather than a closure written in
 * the render.
 */
function RowGap() {
  const gap = useContext(GapContext);
  return <View style={{height: gap}}/>;
}

/**
 * iOS, Android and Windows render React Native's `FlatList` a row of cells
 * at a time: windowed and measured as it draws, so the rows off screen are
 * not drawn and the rows it draws are the rows on screen whatever the cards'
 * height, with the column count worked out from the grid's measured width
 * (the window's until the first layout) less its side insets, which pad the
 * content. A row is a flex row of equal cells
 * with the gap between them, and a last row short of cells keeps its cells
 * the width of the others. A tap on a card reaches it while a field has the
 * keyboard (`keyboardShouldPersistTaps="handled"`), and while the grid is
 * empty its content grows to the grid's height, which an `EmptyState` fills.
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
  contentInset,
  testID,
  style,
}: CardGridProps<T>) {
  const {width: windowWidth} = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const insets = useScrollInsets(contentInset);
  // The columns fit the width between the side insets, which pad the content.
  const columns = columnsFor((measured ?? windowWidth) - insets.left - insets.right, minItemWidth, maxColumns, gap);
  const rows = rowsOf(data, columns);
  const onLayout = (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width);
  return (
    <GapContext.Provider value={gap}>
      <FlatList
        // A new column count is a new cut of the rows, which the list takes as new data: the scroll position survives a resize.
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
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={header ? <>{header}</> : undefined}
        ListFooterComponent={footer ? <>{footer}</> : undefined}
        ListEmptyComponent={empty ? <>{empty}</> : undefined}
        onEndReached={onEndReached}
        // A tap on a card goes to the card while a field has the keyboard; a tap between the cards closes it.
        keyboardShouldPersistTaps="handled"
        // While empty the content grows to the grid's height, so an `EmptyState` fills it under the header.
        contentContainerStyle={[{paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right}, data.length === 0 ? styles.grow : null]}
        scrollIndicatorInsets={{top: insets.top, bottom: insets.bottom}}
        // iOS under a header the screen runs under: UIKit's own inset, which follows a native search bar.
        contentInsetAdjustmentBehavior={insets.automatic ? 'automatic' : undefined}
        onLayout={onLayout}
        style={[styles.grid, style]}
        testID={testID}
      />
    </GapContext.Provider>
  );
}

const styles = StyleSheet.create({
  grid: {flex: 1, alignSelf: 'stretch'},
  row: {flexDirection: 'row', alignItems: 'stretch'},
  cell: {flex: 1, minWidth: 0},
  grow: {flexGrow: 1},
});

export type {CardGridProps} from './types';
