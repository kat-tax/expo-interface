import type {ListProps} from './types';
import {Fragment} from 'react';
import {StyleSheet, View} from 'react-native';
import {List as SwiftUIList, Spacer} from '@expo/ui/swift-ui';
import {frame, listRowSeparator, listStyle, onAppear} from '@expo/ui/swift-ui/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {keyOf} from './shared';

/**
 * iOS renders SwiftUI's `List` in its plain style: the platform's own lazy
 * list, which recycles its rows, draws its separators and scrolls under a
 * translucent bar. The rows are the kit's `ListItem`s, which the `List`
 * insets as rows; the header and the footer are native content before and
 * after them. Outside a host the list mounts one that fills the screen.
 */
export function List<T>(props: ListProps<T>) {
  const hosted = useNativeHost();
  const list = <NativeList {...props}/>;
  if (hosted) return list;
  return (
    <View style={[styles.fill, props.style]} testID={props.testID}>
      <NativeHost fit="fill">{list}</NativeHost>
    </View>
  );
}

function NativeList<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset}: ListProps<T>) {
  const insets = useScrollInsets(contentInset);
  if (data.length === 0 && empty) return <>{empty}</>;
  const last = data.length - 1;
  return (
    <SwiftUIList modifiers={[listStyle('plain'), ...(separators ? [] : [listRowSeparator('hidden')])]}>
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
