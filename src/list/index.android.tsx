import type {ListProps} from './types';
import {Fragment} from 'react';
import {StyleSheet, View} from 'react-native';
import {Box, HorizontalDivider, LazyColumn} from '@expo/ui/jetpack-compose';
import {fillMaxSize, height as heightModifier, onVisibilityChanged, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {useColor} from '../theme';
import {keyOf} from './shared';

/**
 * Android renders Compose's `LazyColumn`: the platform's own lazy list,
 * which composes its rows as they scroll into view and disposes the rest,
 * with Material's `HorizontalDivider` between them. The rows are the kit's
 * `ListItem`s, native content through and through, since a React Native
 * view inside a row is hosted again each time the list recycles it. Outside
 * a host the list mounts one that fills the screen.
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

function NativeList<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset, testID}: ListProps<T>) {
  const separator = useColor('separator');
  const insets = useScrollInsets(contentInset);
  if (data.length === 0 && empty) return <>{empty}</>;
  const last = data.length - 1;
  return (
    <LazyColumn
      contentPadding={{top: insets.top, bottom: insets.bottom}}
      modifiers={[fillMaxSize(), ...(testID ? [testIDModifier(testID)] : [])]}>
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
