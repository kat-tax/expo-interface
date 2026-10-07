import type {SheetProps} from './types';
import {ScrollView, StyleSheet, View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {Layer} from '../windows/layer';
import {ModalLayer} from '../windows/modal-layer';
import {spacing} from '../theme';
import {SheetActions} from './actions';
import {SheetBar} from './bar';
import {hasBar, sub} from './shared';

/**
 * Windows: a sheet's content is React Native's, which no XAML flyout or
 * dialog can hold, and React Native's `Modal` cannot hold a XAML island on
 * react-native-windows 0.84 — so the sheet is a layer drawn in React
 * Native over the window: WinUI's smoke and a centred card in the scheme's
 * background, the way a desktop presents a form, with the content
 * scrolling inside it as hosted content. `isPresented` shows it; `onDismiss`
 * is asked when the smoke or Escape is pressed. The layer covers the whole
 * window under the kit's `Stack` (a layer host) and the nearest ancestor
 * elsewhere. The bar, the accessory, the footer and the actions stay put
 * while the body scrolls, and `maxHeight` caps the body.
 */
export function Sheet({children, isPresented, onDismiss, title, subtitle, onBack, onClose, menu, accessory, footer, actions, maxHeight, testID}: SheetProps) {
  if (!isPresented) return null;
  return (
    <Layer>
      <ModalLayer onDismiss={onDismiss} testID="sheet">
        <NativeHostContext.Provider value={true}>
          <View style={styles.frame}>
            {hasBar({title, onBack, onClose, menu}) ? (
              <SheetBar title={title} subtitle={subtitle} onBack={onBack} onClose={onClose} menu={menu} testID={sub(testID, 'bar')}/>
            ) : null}
            {accessory}
            <ScrollView style={[styles.scroll, maxHeight !== undefined ? {maxHeight} : null]} testID={sub(testID, 'body')}>
              <View style={styles.content}>{children}</View>
            </ScrollView>
            {footer}
            {actions && actions.length > 0 ? <SheetActions actions={actions} testID={sub(testID, 'actions')}/> : null}
          </View>
        </NativeHostContext.Provider>
      </ModalLayer>
    </Layer>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: spacing.three,
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    width: '100%',
  },
});

export type {SheetAction, SheetMaterial, SheetProps} from './types';
