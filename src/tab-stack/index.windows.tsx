import type {TabStackProps} from './index';
import {Stack} from '../router/stack';

/**
 * Windows: the tab's stack is the kit's own `Stack` (Expo Router's stack
 * router under a drawn header, since react-native-screens has no Windows
 * renderer), with the tab's root screen titled and its trailing slot
 * filled. `Screen` reads the header from the context the stack sets.
 */
export function TabStack({title, headerRight}: TabStackProps) {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title, headerRight}}/>
    </Stack>
  );
}

export type {TabStackProps} from './index';
