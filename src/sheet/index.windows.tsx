import type {BottomSheetProps} from '@expo/ui';
import {Modal, ScrollView, StyleSheet, View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {bound, spacing, useColor} from '../theme';

/**
 * Windows: a sheet's content is React Native's, which no XAML flyout or
 * dialog can hold, so the sheet is React Native's `Modal` — which
 * react-native-windows presents as a window of its own over the app, the
 * way a desktop presents a form — painted in the scheme's background, with
 * the content at the kit's sheet width. `isPresented` shows it and
 * `onDismiss` is asked when the window is closed.
 */
export function Sheet({children, isPresented, onDismiss}: BottomSheetProps) {
  const background = useColor('background');
  return (
    <Modal visible={isPresented} onRequestClose={onDismiss} onDismiss={onDismiss}>
      <NativeHostContext.Provider value={true}>
        <ScrollView style={[styles.window, {backgroundColor: background}]} contentContainerStyle={styles.scroll}>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </NativeHostContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  window: {
    flex: 1,
  },
  scroll: {
    alignItems: 'center',
    padding: spacing.three,
  },
  content: {
    width: '100%',
    maxWidth: bound.contentMaxWidth - 200,
  },
});
