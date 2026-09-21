import type {ComponentType, PropsWithChildren, ReactNode} from 'react';
import {ExpoRoot} from 'expo-router';
import {Platform, StyleSheet, View} from 'react-native';
import {Body, Title} from '../typography';
import {ConstrainedStackHeader} from '../stack-header';
import {Stack} from '../router/stack';

/** In-memory `app/` directory: route name (`_layout`, `index`, `settings`) to screen. */
export type Routes = Record<string, ComponentType<any>>;

export interface RouterAppProps {
  /** The routes the app is built from. */
  routes: Routes;
  /** Route the app opens on. */
  url?: string;
}

/**
 * `require.context` stub over `routes`, the shape expo-router builds from an
 * `app/` directory. `expo-vitest/router` makes the same one for the suite.
 */
function inMemoryContext(routes: Routes) {
  return Object.assign((id: string) => ({default: routes[id.replace(/^\.\//, '').replace(/\.\w*$/, '')]}), {
    resolve: (key: string) => key,
    id: '0',
    keys: () => Object.keys(routes).map(key => `./${key}.js`),
  });
}

/**
 * The navigators are the exports an app cannot hold without a router around
 * them, so a story builds one: these routes instead of an `app/` directory,
 * and `location` in place of the browser's URL, which keeps a story from
 * navigating the page the Storybook itself is on.
 */
export function RouterApp({routes, url = '/'}: RouterAppProps) {
  return <ExpoRoot context={inMemoryContext(routes)} location={url}/>;
}

/**
 * A one screen app whose header carries `headerRight`: what a header control
 * needs around it, since it reads the screen's focus, with the kit's own
 * header on web and the native stack's bar everywhere else.
 */
export function headerApp(title: string, body: string, headerRight: () => ReactNode): Routes {
  return {
    _layout: () => (
      <Stack
        screenOptions={{
          headerShown: true,
          header: Platform.OS === 'web' ? ConstrainedStackHeader : undefined,
          headerRight,
        }}>
        <Stack.Screen name="index" options={{title}}/>
      </Stack>
    ),
    index: () => <Page title={title} body={body}/>,
  };
}

/** A screen of the demo app the router stories mount: a heading and a line about it. */
export function Page({title, body, children}: PropsWithChildren<{title: string; body?: string}>) {
  return (
    <View style={styles.page}>
      <Title>{title}</Title>
      {body ? <Body color="secondaryLabel">{body}</Body> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, gap: 8, padding: 16},
});
