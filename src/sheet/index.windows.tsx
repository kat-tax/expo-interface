import type {BottomSheetProps} from '@expo/ui';
import {ScrollView, StyleSheet, View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {Layer} from '../windows/layer';
import {ModalLayer} from '../windows/modal-layer';
import {spacing} from '../theme';

/**
 * Windows: a sheet's content is React Native's, which no XAML flyout or
 * dialog can hold, and React Native's `Modal` cannot hold a XAML island on
 * react-native-windows 0.84 — so the sheet is a layer drawn in React
 * Native over the window: WinUI's smoke and a centred card in the scheme's
 * background, the way a desktop presents a form, with the content
 * scrolling inside it as hosted content. `isPresented` shows it; `onDismiss`
 * is asked when the smoke or Escape is pressed. The layer covers the whole
 * window under the kit's `Stack` (a layer host) and the nearest ancestor
 * elsewhere.
 */
export function Sheet({children, isPresented, onDismiss}: BottomSheetProps) {
  if (!isPresented) return null;
  return (
    <Layer>
      <ModalLayer onDismiss={onDismiss} testID="sheet">
        <NativeHostContext.Provider value={true}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.content}>{children}</View>
          </ScrollView>
        </NativeHostContext.Provider>
      </ModalLayer>
    </Layer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.three,
  },
  content: {
    width: '100%',
  },
});
