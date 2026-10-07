import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {HorizontalFloatingToolbar} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {useColor} from '../theme';

interface FloatingSurfaceProps extends PropsWithChildren {
  /** The space between the controls; Material's toolbar keeps its own. */
  gap: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Android: a floating bar is Material 3's `HorizontalFloatingToolbar`, its
 * container, its elevation and its spacing, in the screen's raised fill
 * with the commands in the label color, in a host of its own the width of
 * the controls.
 */
export function FloatingSurface({style, testID, children}: FloatingSurfaceProps) {
  const container = useColor('backgroundElement');
  const content = useColor('label');
  return (
    <NativeHost fit style={[styles.host, style]}>
      <HorizontalFloatingToolbar
        colors={{toolbarContainerColor: container, toolbarContentColor: content}}
        modifiers={testID ? [testIDModifier(testID)] : undefined}>
        {children}
      </HorizontalFloatingToolbar>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  host: {
    alignSelf: 'flex-start',
  },
});
