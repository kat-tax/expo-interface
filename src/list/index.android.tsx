import type {ListProps} from './types';
import {Fragment, useContext, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Box, HorizontalDivider, LazyColumn} from '@expo/ui/jetpack-compose';
import {fillMaxSize, fillMaxWidth, height as heightModifier, onSizeChanged, onVisibilityChanged, testID as testIDModifier, wrapContentHeight} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {SheetBodyCapContext} from '../sheet/cap-context';
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
 * of the list. As the body of a `Sheet` with `maxHeight` the list is as
 * tall as its rows, up to the cap, and scrolls inside the cap past it: the
 * body's scroll view gives a child no height to fill, and a lazy column has
 * no height of its own to report, so the column is measured under the cap
 * with no minimum, in a box that says how tall it came out. A change in the
 * number of rows measures again from the cap.
 */
export function List<T>(props: ListProps<T>) {
  const hosted = useNativeHost();
  const cap = useContext(SheetBodyCapContext);
  const rows = props.data.length;
  const [measured, setMeasured] = useState<{rows: number; height: number}>();
  if (hosted) return <NativeList {...props}/>;
  const height = cap === undefined ? undefined : measured?.rows === rows ? Math.min(measured.height, cap) : cap;
  return (
    <View style={[height === undefined ? styles.fill : {alignSelf: 'stretch', height}, props.style]} testID={props.testID}>
      {showsEmpty(props) ? props.empty : (
        <NativeHost fit="fill">
          <NativeList {...props} onHeight={cap === undefined ? undefined : next => setMeasured({rows, height: next})}/>
        </NativeHost>
      )}
    </View>
  );
}

function NativeList<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, contentInset, testID, onHeight}: ListProps<T> & {onHeight?: (height: number) => void}) {
  const separator = useColor('separator');
  const insets = useScrollInsets(contentInset);
  const tag = testID ? [testIDModifier(testID)] : [];
  // Under a host of the screen's: native content, centred where the rows would be.
  if (showsEmpty({data, empty})) return <Box contentAlignment="center" modifiers={[fillMaxSize(), ...tag]}>{empty}</Box>;
  const last = data.length - 1;
  const column = (
    <LazyColumn
      contentPadding={{top: insets.top, bottom: insets.bottom, start: insets.left, end: insets.right}}
      // Measured (a capped body), it is as tall as its rows up to the box's cap; otherwise it fills its host.
      modifiers={[onHeight ? fillMaxWidth() : fillMaxSize(), ...tag]}>
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
  if (!onHeight) return column;
  // The box takes no minimum and reports the column's height. The column
  // cannot report its own: `@expo/ui` registers its lazy column without the
  // event a modifier's handler is called through, so it would never be.
  return <Box modifiers={[fillMaxWidth(), wrapContentHeight('top'), onSizeChanged(next => onHeight(next.height))]}>{column}</Box>;
}

const styles = StyleSheet.create({
  fill: {flex: 1, alignSelf: 'stretch'},
});

export type {ListProps} from './types';
