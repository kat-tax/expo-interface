import type {ComponentProps, ReactNode} from 'react';
import {Navigator, StackRouter} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import {ScreenHeader} from '../screen/header';
import {StackHeaderContext} from '../stack-header/context';

/** The header options the Windows stack reads from a screen. */
export interface WindowsStackOptions {
  title?: string;
  headerTitle?: string | (() => ReactNode);
  headerShown?: boolean;
  headerRight?: (props: {tintColor?: string}) => ReactNode;
  headerLeft?: (props: {tintColor?: string}) => ReactNode;
}

type NavigatorProps = ComponentProps<typeof Navigator>;

export interface StackProps {
  /** Options for every screen; `headerShown: false` hides the header row. */
  screenOptions?: WindowsStackOptions;
  initialRouteName?: NavigatorProps['initialRouteName'];
  /** `Stack.Screen` elements configuring named routes. */
  children?: ReactNode;
}

/**
 * Windows: a stack on Expo Router's stack router, drawn without
 * react-native-screens (which has no Windows renderer). The focused route
 * is rendered under a header row — the route's title, a back button when
 * there is a screen behind it, and its `headerRight` — unless the screen
 * hides it. Pushes and pops are immediate: WinUI navigates between pages
 * without a slide.
 */
function StackNavigator({screenOptions, initialRouteName, children}: StackProps) {
  return (
    <StackHeaderContext.Provider value={screenOptions?.headerShown !== false}>
      <Navigator router={StackRouter} initialRouteName={initialRouteName} screenOptions={screenOptions}>
        {children}
        <StackBody/>
      </Navigator>
    </StackHeaderContext.Provider>
  );
}

function StackBody() {
  const {state, descriptors, navigation} = Navigator.useContext();
  const route = state.routes[state.index];
  // The focused route always has a descriptor, and a descriptor always has options.
  const options = descriptors[route.key].options as WindowsStackOptions;
  const title = typeof options.headerTitle === 'string' ? options.headerTitle : options.title ?? route.name;
  const canGoBack = state.index > 0;
  return (
    <View style={styles.root}>
      {options.headerShown !== false ? (
        <ScreenHeader
          title={title}
          onBack={canGoBack ? () => navigation.goBack() : undefined}
          trailing={options.headerRight?.({})}
        />
      ) : null}
      <View style={styles.slot}>
        <Navigator.Slot/>
      </View>
    </View>
  );
}

export const Stack = Object.assign(StackNavigator, {
  /** Configures a route's options from a layout (`name`) or from the screen itself. */
  Screen: Navigator.Screen,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
});
