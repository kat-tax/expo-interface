import type {PropsWithChildren} from 'react';
import type {BottomSheetContentPadding} from '@expo/ui';
import {Platform, ScrollView, StyleSheet} from 'react-native';
import {SheetHosted} from './hosted';
import {useSheetBodyWidth} from './width';

interface SheetBodyProps extends PropsWithChildren {
  maxHeight?: number;
  contentPadding?: BottomSheetContentPadding;
  testID?: string;
}

/**
 * The sheet's body: the children as they are, which on iOS and Android is
 * the sheet's native content, unless the sheet is capped. Capped, they
 * scroll inside a React Native box the width of the sheet and no taller
 * than the cap, hosted in the sheet on iOS and Android so it takes presses
 * and its width.
 */
export function SheetBody({maxHeight, contentPadding, testID, children}: SheetBodyProps) {
  const width = useSheetBodyWidth(contentPadding);
  if (maxHeight === undefined) return <>{children}</>;
  return (
    <SheetHosted contentPadding={contentPadding}>
      <ScrollView
        style={[styles.scroll, {maxHeight, width}]}
        contentContainerStyle={styles.content}
        // Android: the hosted box hands a drag that starts here to Compose's
        // sheet, which expands before the body scrolls and collapses when the
        // body is dragged down from its top, as a list in a Material sheet
        // does. React Native offers nested scrolls only when asked.
        nestedScrollEnabled
        // On web the capped body is a scroller, which has to be reachable from
        // the keyboard, or only a pointer can scroll it.
        tabIndex={Platform.OS === 'web' ? 0 : undefined}
        testID={testID}>
        {children}
      </ScrollView>
    </SheetHosted>
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
