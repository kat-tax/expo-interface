import type {ComponentProps, ReactNode} from 'react';
import {createContext, useContext, useEffect} from 'react';
import Constants from 'expo-constants';
import {requireOptionalNativeModule} from 'expo-modules-core';
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
  const depth = useContext(StackDepthContext) + 1;
  return (
    <StackHeaderContext.Provider value={screenOptions?.headerShown !== false}>
      <StackDepthContext.Provider value={depth}>
        <Navigator router={StackRouter} initialRouteName={initialRouteName} screenOptions={screenOptions}>
          {children}
          <StackBody/>
        </Navigator>
      </StackDepthContext.Provider>
    </StackHeaderContext.Provider>
  );
}

function titleOf(options: WindowsStackOptions, name: string): string {
  return typeof options.headerTitle === 'string' ? options.headerTitle : options.title ?? name;
}

/** The runtime's window module (`expo-windows`), when the app runs on it. */
interface WindowModule {
  setWindowTitle(title: string): void;
}

/** How many stacks are above this one. */
const StackDepthContext = createContext(0);

interface TitleRegistration {
  depth: number;
  /** Mount order: of two stacks at one depth, the later mounted is the one in front. */
  order: number;
  /** The focused screen's title, or `null` where the focused route is a navigator or a group. */
  title: string | null;
  /** The focused screen is a modal, over everything a deeper stack shows. */
  modal: boolean;
}

/** What each mounted stack asks for, by its navigation state's key. */
const registrations = new Map<string, TitleRegistration>();
let mounted = 0;

/** "Settings – My App", as a desktop window and the taskbar name it; the title alone without an app name. */
function windowTitle(title: string): string {
  const app = Constants.expoConfig?.name;
  return app && app !== title ? `${title} – ${app}` : title;
}

/** In front: a modal before a card, then the innermost stack, then the later mounted. Exported for its test. */
export function inFront(a: TitleRegistration, b: TitleRegistration): boolean {
  if (a.modal !== b.modal) return a.modal;
  if (a.depth !== b.depth) return a.depth > b.depth;
  return a.order > b.order;
}

/**
 * The title of the innermost mounted stack that is focused on a screen —
 * a root stack focused on a tab group leaves the window to the tab's
 * stack — unless a stack is focused on a modal, which is over everything.
 * Every mounted stack is on the focused path: the kit's stack and tabs
 * render only their focused route, so mounting and unmounting keep the
 * registry current.
 */
function focusedTitle(): string | null {
  let front: TitleRegistration | null = null;
  for (const entry of registrations.values()) {
    if (entry.title && (!front || inFront(entry, front))) front = entry;
  }
  return front?.title ?? null;
}

function applyWindowTitle() {
  const windows = requireOptionalNativeModule<WindowModule>('ExpoWindows');
  if (!windows) return;
  const title = focusedTitle();
  if (title !== null) windows.setWindowTitle(windowTitle(title));
}

/** Keeps the window's title at the focused screen's through the runtime, when the app runs on it. */
function useWindowTitle(key: string, title: string | null, depth: number, modal: boolean) {
  useEffect(() => {
    registrations.set(key, {depth, order: mounted++, title, modal});
    applyWindowTitle();
    return () => {
      registrations.delete(key);
      applyWindowTitle();
    };
  }, [key, title, depth, modal]);
}

/** A route that is a navigator, or a group (`(tabs)`), has no title of its own; a screen's is its title or its name. */
function screenTitle(route: {name: string; state?: unknown}, options: WindowsStackOptions): string | null {
  if (route.state) return null;
  const title = titleOf(options, route.name);
  return title === route.name && /^\(.+\)$/.test(route.name) ? null : title;
}

function StackBody() {
  const {state, descriptors, navigation} = Navigator.useContext();
  // Every route in the state has a descriptor, and a descriptor its options.
  const optionsOf = (index: number) => descriptors[state.routes[index].key].options as WindowsStackOptions;
  const focused = state.routes[state.index];
  useWindowTitle(state.key, screenTitle(focused, optionsOf(state.index)), useContext(StackDepthContext), isModal(optionsOf(state.index).presentation));

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
