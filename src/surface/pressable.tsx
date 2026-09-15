import type {StatePressableProps} from './types';
import {Pressable} from 'react-native';

/**
 * `Pressable` whose style callback also sees `hovered`: what
 * react-native-web already reports in the state, what Windows tracks itself
 * (`pressable.windows.tsx`), and never true on iOS and Android.
 */
export function StatePressable({style, ...rest}: StatePressableProps) {
  return <Pressable {...rest} style={state => style({hovered: false, ...state})}/>;
}
