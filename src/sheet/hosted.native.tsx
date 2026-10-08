import type {SheetHostedProps} from './shared';
import {RNHostView} from '@expo/ui';
import {View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {useSheetBodyWidth} from './width';

/**
 * iOS and Android: React Native content in the sheet (a capped body, the
 * footer), hosted in a box the sheet's width. The platform presents the
 * sheet in a window or view controller of its own, where only an
 * `RNHostView` dispatches React Native touches and gives a React Native box
 * a size; without one, a `Pressable` there takes no press and a box that
 * fills its width has none to fill. The box is React Native content, not the
 * sheet's native content, so a kit control inside mounts a host of its own.
 */
export function SheetHosted({contentPadding, testID, children}: SheetHostedProps) {
  const width = useSheetBodyWidth(contentPadding);
  return (
    <RNHostView matchContents>
      <View style={{width}} testID={testID}>
        <NativeHostContext.Provider value={false}>{children}</NativeHostContext.Provider>
      </View>
    </RNHostView>
  );
}
