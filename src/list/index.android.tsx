import type {ListProps} from './types';
import {Fragment} from 'react';
import {StyleSheet, View} from 'react-native';
import {Box, HorizontalDivider, LazyColumn} from '@expo/ui/jetpack-compose';
import {fillMaxSize, height as heightModifier, onVisibilityChanged, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {useColor} from '../theme';
import {keyOf, showsEmpty} from './shared';

/**
 * Android renders Compose's `LazyColumn`: the platform's own lazy list,
 * which composes its rows as they scroll into view and disposes the rest,
 * with Material's `HorizontalDivider` between them. The rows are the kit's
 * `ListItem`s, native content through and through, since a React Native
 * view inside a row is hosted again each time the list recycles it. Outside
 * a host the list mounts one that fills the screen, and while it shows its
 * `empty` content it mounts none: that content sits in the list's own view,
 * so an `EmptyState` brings its own host and fills the list, where hosts may
 * not nest. Under a host the `empty` content is centred in a `Box` the size
 * of the list.
 */
export function List<T>(props: ListProps<T>) {
  const hosted = useNativeHost();
  if (hosted) return <NativeList {...props}/>;
  return (
    <View style={[styles.fill, props.style]} testID={props.testID}>
      {showsEmpty(props) ? props.empty : <NativeHost fit="fill"><NativeList {...props}/></NativeHost>}
    </View>
  );
}

function NativeList<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset, testID}: ListProps<T>) {
  const separator = useColor('separator');
  const insets = useScrollInsets(contentInset);
  const modifiers = [fillMaxSize(), ...(testID ? [testIDModifier(testID)] : [])];
  // Under a host of the screen's: native content, centred where the rows would be.
  if (showsEmpty({data, empty})) return <Box contentAlignment="center" modifiers={modifiers}>{empty}</Box>;
  const last = data.length - 1;
  return (
    <LazyColumn
      contentPadding={{top: insets.top, bottom: insets.bottom}}
      modifiers={modifiers}>
      {header}
      {data.map((item, index) => (
        <Fragment key={keyOf({keyExtractor}, item, index)}>
          {renderItem(item, index)}
          {separators && index < last ? <HorizontalDivider color={separator} thickness={StyleSheet.hairlineWidth}/> : null}
          {index === last && onEndReached ? (
            // The last row's neighbour: composed when the last row comes into view, which is the end.
            <Box modifiers={[heightModifier(1), onVisibilityChanged(visible => visible && onEndReached())]}/>
          ) : null}
        </Fragment>
      ))}
      {footer}
    </LazyColumn>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1, alignSelf: 'stretch'},
});

export type {ListProps} from './types';
