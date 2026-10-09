import type {ListProps} from './types';
import {Fragment, useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {List as SwiftUIList, Spacer} from '@expo/ui/swift-ui';
import {frame, listRowSeparator, listStyle, onAppear, padding} from '@expo/ui/swift-ui/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {SheetBodyCapContext} from '../sheet/cap-context';
import {keyOf, showsEmpty} from './shared';

/**
 * iOS renders SwiftUI's `List` in its plain style: the platform's own lazy
 * list, which recycles its rows, draws its separators and scrolls under a
 * translucent bar. The rows are the kit's `ListItem`s, which the `List`
 * insets as rows; the header and the footer are native content before and
 * after them. A top or bottom `contentInset` is a clear row of that height,
 * and a side inset pads the list as a whole, since `@expo/ui` has no content
 * margins for a scroll view. Outside a host the list mounts one that fills the screen, and
 * while it shows its `empty` content it mounts none: that content sits in
 * the list's own view, so an `EmptyState` brings its own host and fills the
 * list, where hosts may not nest. As the body of a `Sheet` with `maxHeight`
 * the list is the cap tall instead: the body's scroll view gives a child no
 * height to fill, so the list takes the cap and scrolls inside it.
 */
export function List<T>(props: ListProps<T>) {
  const hosted = useNativeHost();
  const cap = useContext(SheetBodyCapContext);
  if (hosted) return <NativeList {...props}/>;
  return (
    <View style={[cap === undefined ? styles.fill : {alignSelf: 'stretch', height: cap}, props.style]} testID={props.testID}>
      {showsEmpty(props) ? props.empty : <NativeHost fit="fill"><NativeList {...props}/></NativeHost>}
    </View>
  );
}

function NativeList<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset}: ListProps<T>) {
  const insets = useScrollInsets(contentInset);
  // Under a host of the screen's: native content, as the rows are.
  if (showsEmpty({data, empty})) return <>{empty}</>;
  const last = data.length - 1;
  // The sides inset the whole list, separators and scroll indicator with the rows: `@expo/ui` has no content margins for a scroll view.
  const sides = insets.left > 0 || insets.right > 0 ? [padding({leading: insets.left, trailing: insets.right})] : [];
  return (
    <SwiftUIList modifiers={[listStyle('plain'), ...(separators ? [] : [listRowSeparator('hidden')]), ...sides]}>
      {insets.top > 0 ? <Spacer modifiers={[frame({height: insets.top}), listRowSeparator('hidden')]}/> : null}
      {header}
      {data.map((item, index) => (
        <Fragment key={keyOf({keyExtractor}, item, index)}>
          {renderItem(item, index)}
          {index === last && onEndReached ? (
            // The last row's neighbour: SwiftUI draws it when the last row is
            // drawn, which is when a list that loads more has reached its end.
            <Spacer modifiers={[frame({height: 1}), listRowSeparator('hidden'), onAppear(onEndReached)]}/>
          ) : null}
        </Fragment>
      ))}
      {footer}
      {insets.bottom > 0 ? <Spacer modifiers={[frame({height: insets.bottom}), listRowSeparator('hidden')]}/> : null}
    </SwiftUIList>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1, alignSelf: 'stretch'},
});

export type {ListProps} from './types';
