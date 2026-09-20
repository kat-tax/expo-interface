import {Slot} from 'expo-router';

/**
 * The current route and nothing around it. Expo Router's `Stack` is
 * react-native-screens' native views, which Windows has not got; a UI kit
 * brings a stack of its own, and the runtime alone needs none to show a route.
 */
export default function Layout() {
  return <Slot/>;
}
