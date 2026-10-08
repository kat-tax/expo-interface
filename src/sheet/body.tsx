import type {PropsWithChildren} from 'react';
import type {BottomSheetContentPadding} from '@expo/ui';
import {Platform, ScrollView, StyleSheet} from 'react-native';
import {useSheetBodyWidth} from './width';

interface SheetBodyProps extends PropsWithChildren {
  maxHeight?: number;
  contentPadding?: BottomSheetContentPadding;
  testID?: string;
}

/**
 * The sheet's body: the children as they are, unless the sheet is capped,
 * when they scroll inside a React Native box the width of the sheet and no
 * taller than the cap.
 */
export function SheetBody({maxHeight, contentPadding, testID, children}: SheetBodyProps) {
  const width = useSheetBodyWidth(contentPadding);
  if (maxHeight === undefined) return <>{children}</>;
  return (
    <ScrollView
      style={[styles.scroll, {maxHeight, width}]}
      contentContainerStyle={styles.content}
      // On web the capped body is a scroller, which has to be reachable from
      // the keyboard, or only a pointer can scroll it.
      tabIndex={Platform.OS === 'web' ? 0 : undefined}
      testID={testID}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    width: '100%',
  },
});
