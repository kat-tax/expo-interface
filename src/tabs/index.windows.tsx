import type {TabBarProps, TabRoute} from './types';
import {Navigator, TabRouter} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import XamlNavigationView from '../windows/specs/ExpoInterfaceNavigationViewNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {windowsGlyph} from '../symbol/segoe';

/**
 * Windows: a WinUI 3 `NavigationView` in its top mode — the platform's tab
 * bar, a row of items along the top of the window — over the focused tab's
 * screens. The routes are Expo Router's, driven by a custom navigator on
 * the tab router (no native tabs, which react-native-screens does not draw
 * on Windows), so `Link`, `useRouter` and the rest work as they do
 * anywhere. `hidden` drops the bar and leaves the screens.
 */
export function Tabs({routes, hidden = false}: TabBarProps) {
  return (
    <Navigator router={TabRouter} initialRouteName={routes[0]?.name}>
      <TabsBody routes={routes} hidden={hidden}/>
    </Navigator>
  );
}

/** The bar's items as the island's JSON: the label and the Fluent glyph of each tab. */
export function tabItems(routes: readonly TabRoute[]): string {
  return jsonProp(routes.map(route => ({
    label: route.label,
    glyph: windowsGlyph({symbol: route.icon}) ?? null,
  })));
}

function TabsBody({routes, hidden}: {routes: readonly TabRoute[]; hidden: boolean}) {
  const {state, navigation} = Navigator.useContext();
  const xaml = useXamlProps();
  const current = state.routes[state.index]?.name;
  const selectedIndex = Math.max(0, routes.findIndex(route => route.name === current));
  return (
    <View style={styles.root}>
      {!hidden ? (
        <XamlNavigationView
          items={tabItems(routes)}
          selectedIndex={selectedIndex}
          onSelectionChange={event => {
            const route = routes[event.nativeEvent.index];
            if (route && route.name !== current) navigation.navigate(route.name);
          }}
          style={styles.bar}
          testID="tab-bar"
          {...xaml}
        />
      ) : null}
      <View style={styles.slot}>
        <Navigator.Slot/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bar: {
    alignSelf: 'stretch',
  },
  slot: {
    flex: 1,
  },
});
