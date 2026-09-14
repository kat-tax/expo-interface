/**
 * The platform's stack navigator: Expo Router's own (the native stack) on
 * iOS, Android and web. Windows, where react-native-screens draws nothing,
 * has a stack of its own in `stack.windows.tsx`; an app that uses this
 * `Stack` in its layouts instead of Expo Router's has a Windows build with
 * no other change.
 */
export {Stack} from 'expo-router';
