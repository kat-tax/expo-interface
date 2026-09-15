import type {ComponentProps, ReactNode} from 'react';
import {Navigator, StackRouter} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import {ScreenHeader} from '../screen/header';
import {StackHeaderContext} from '../stack-header/context';
import {LayerHost} from '../windows/layer';
import {ModalLayer} from '../windows/modal-layer';

/** How a screen is presented: as a card in the stack, or over it. */
export type WindowsStackPresentation =
  | 'card'
  | 'modal'
  | 'transparentModal'
  | 'containedModal'
  | 'containedTransparentModal'
  | 'fullScreenModal'
  | 'formSheet';

/** The header options the Windows stack reads from a screen. */
export interface WindowsStackOptions {
  title?: string;
  headerTitle?: string | (() => ReactNode);
  headerShown?: boolean;
  headerRight?: (props: {tintColor?: string}) => ReactNode;
  headerLeft?: (props: {tintColor?: string}) => ReactNode;
  /**
   * `modal`, `formSheet`, `containedModal` and `fullScreenModal` present the
   * screen in a card over smoke, as a WinUI dialog is arranged; the
   * transparent ones lay it over the window as it is. Escape, the smoke and
   * the header's back button dismiss it.
   */
  presentation?: WindowsStackPresentation;
}

type NavigatorProps = ComponentProps<typeof Navigator>;

export interface StackProps {
  /** Options for every screen; `headerShown: false` hides the header row. */
  screenOptions?: WindowsStackOptions;
  initialRouteName?: NavigatorProps['initialRouteName'];
  /** `Stack.Screen` elements configuring named routes. */
  children?: ReactNode;
}

const TRANSPARENT = new Set<WindowsStackPresentation>(['transparentModal', 'containedTransparentModal']);

function isModal(presentation: WindowsStackPresentation | undefined): boolean {
  return presentation !== undefined && presentation !== 'card';
}

/**
 * Windows: a stack on Expo Router's stack router, drawn without
 * react-native-screens (which has no Windows renderer). The focused card is
 * rendered under a header row — the route's title, a back button when there
 * is a screen behind it, and its `headerRight` — unless the screen hides
 * it; a screen presented as a modal is drawn over the card below it, in a
 * dialog's arrangement. Pushes and pops are immediate: WinUI navigates
 * between pages without a slide. The stack is a layer host, so Alt+Left,
 * the keyboard's back key and the mouse's back button pop it from wherever
 * the focus is, Escape closes the topmost modal, and a `Sheet` below it
 * covers the window.
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

function titleOf(options: WindowsStackOptions, name: string): string {
  return typeof options.headerTitle === 'string' ? options.headerTitle : options.title ?? name;
}

function StackBody() {
  const {state, descriptors, navigation} = Navigator.useContext();
  // Every route in the state has a descriptor, and a descriptor its options.
  const optionsOf = (index: number) => descriptors[state.routes[index].key].options as WindowsStackOptions;

  // The card: the last route at or below the focus that is not presented over another.
  let baseIndex = state.index;
  while (baseIndex > 0 && isModal(optionsOf(baseIndex).presentation)) baseIndex -= 1;
  const base = state.routes[baseIndex];
  const baseOptions = optionsOf(baseIndex);
  const modals = state.routes.slice(baseIndex + 1, state.index + 1);
  const goBack = () => navigation.goBack();

  return (
    <LayerHost onBack={state.index > 0 ? goBack : undefined} testID="windows-stack">
      <View style={styles.root}>
        {baseOptions.headerShown !== false ? (
          <ScreenHeader
            title={titleOf(baseOptions, base.name)}
            onBack={baseIndex > 0 ? goBack : undefined}
            trailing={baseOptions.headerRight?.({})}
          />
        ) : null}
        <View style={styles.slot}>{descriptors[base.key].render()}</View>
      </View>
      {modals.map((route, index) => {
        const options = descriptors[route.key].options as WindowsStackOptions;
        const transparent = TRANSPARENT.has(options.presentation as WindowsStackPresentation);
        const top = index === modals.length - 1;
        return (
          <ModalLayer key={route.key} transparent={transparent} tall onDismiss={top ? goBack : undefined} testID={`modal-${route.name}`}>
            {!transparent && options.headerShown !== false ? (
              <ScreenHeader title={titleOf(options, route.name)} onBack={goBack} trailing={options.headerRight?.({})}/>
            ) : null}
            <View style={styles.slot}>{descriptors[route.key].render()}</View>
          </ModalLayer>
        );
      })}
    </LayerHost>
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
