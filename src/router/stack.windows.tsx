import type {ComponentProps, ReactNode} from 'react';
import {createContext, useCallback, useContext, useEffect, useId, useMemo, useState} from 'react';
import Constants from 'expo-constants';
import {requireOptionalNativeModule} from 'expo-modules-core';
import {Navigator, StackRouter} from 'expo-router';
import {Animated, StyleSheet, View} from 'react-native';
import type {Entrance} from '../windows/entrance';
import {ScreenHeader} from '../screen/header';
import {StackHeaderContext} from '../stack-header/context';
import {BackStoreContext, ShellCardsContext, ShellHostContext} from '../tabs/shell';
import {useColor} from '../theme';
import {useEntrance} from '../windows/entrance';
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
  /** The title text, or a node drawn in its place. */
  headerTitle?: string | ((props: {children: string; tintColor?: string}) => ReactNode);
  headerShown?: boolean;
  headerRight?: (props: {tintColor?: string}) => ReactNode;
  /** Drawn in place of the back button. */
  headerLeft?: (props: {tintColor?: string; canGoBack: boolean}) => ReactNode;
  /** `false` hides the back button; Alt+Left and the back keys still pop. */
  headerBackVisible?: boolean;
  /**
   * `modal`, `formSheet`, `containedModal` and `fullScreenModal` present the
   * screen in a card over smoke, as a WinUI dialog is arranged; the
   * transparent ones lay it over the window as it is. Escape, the smoke and
   * the header's back button dismiss it.
   */
  presentation?: WindowsStackPresentation;
  /**
   * How the screen arrives: WinUI's entrance — a card slides up a little and
   * fades in, a modal settles from a little larger — a `fade` alone, or
   * `none`.
   * @default 'default'
   */
  animation?: Entrance;
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
 *
 * A route that holds the kit's `Tabs` is the window's frame, as WinUI's
 * `NavigationView` is: a card pushed over it is drawn inside the tabs'
 * content with the pane still there, and the pane's back button pops it.
 * Under a pane a header row draws no back button of its own, since the
 * pane's is the platform's; a modal keeps its dismiss.
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
  const depth = useContext(StackDepthContext);
  useWindowTitle(state.key, screenTitle(focused, optionsOf(state.index)), depth, isModal(optionsOf(state.index).presentation));

  // The card: the last route at or below the focus that is not presented over another.
  let baseIndex = state.index;
  while (baseIndex > 0 && isModal(optionsOf(baseIndex).presentation)) baseIndex -= 1;
  const baseOptions = optionsOf(baseIndex);
  const modals = state.routes.slice(baseIndex + 1, state.index + 1);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // The routes whose tabs said they are drawn: a frame for the cards over them.
  const [frames, setFrames] = useState<ReadonlySet<string>>(() => new Set());
  const register = useCallback((key: string, hosts: boolean) => {
    setFrames(previous => {
      const next = new Set(previous);
      if (hosts) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);
  // The frame under the card, if there is one: the nearest route below it whose tabs are drawn. The
  // frame is what is rendered then, with the card handed down to be drawn in its content.
  let frameIndex = baseIndex;
  while (frameIndex > 0 && !frames.has(state.routes[frameIndex].key)) frameIndex -= 1;
  const framed = frameIndex < baseIndex && frames.has(state.routes[frameIndex].key);
  const bodyIndex = framed ? frameIndex : baseIndex;
  const body = state.routes[bodyIndex];
  const bodyOptions = optionsOf(bodyIndex);
  const host = useMemo(() => (hosts: boolean) => register(body.key, hosts), [register, body.key]);
  const base = state.routes[baseIndex];
  const cards = useMemo<ShellCardsValue | null>(() => framed ? {
    card: <ShellCard key={base.key} route={base} options={baseOptions} render={descriptors[base.key].render}/>,
    goBack,
    popAll: () => navigation.dispatch({type: 'POP', payload: {count: state.index - frameIndex}}),
  } : null, [framed, base, baseOptions, descriptors, goBack, navigation, state.index, frameIndex]);

  // Under a pane that draws the back button, a stack that can pop hands its way back to it.
  const store = useContext(BackStoreContext);
  const id = useId();
  const canGoBack = state.index > 0 && baseOptions.headerBackVisible !== false;
  useEffect(() => {
    store?.set(id, canGoBack ? goBack : null);
  }, [store, id, canGoBack, goBack]);
  useEffect(() => () => store?.set(id, null), [store, id]);

  const entrance = useEntrance(body.key, 'card', bodyOptions.animation);
  // Painted, so that a card arriving — translucent, a little below — shows the scheme behind it, not the window's own white.
  const background = useColor('background');

  return (
    <LayerHost onBack={state.index > 0 ? goBack : undefined} takesFocus={depth === 1} testID="windows-stack">
      <View style={[styles.root, {backgroundColor: background}]}>
        {bodyOptions.headerShown !== false ? (
          <ScreenHeader {...headerOf(bodyOptions, body.name, bodyIndex > 0 ? goBack : undefined, store === null)} dragRegion={depth === 1}/>
        ) : null}
        <Animated.View style={[styles.slot, entrance]}>
          <ShellCardsContext.Provider value={cards}>
            <ShellHostContext.Provider value={host}>{descriptors[body.key].render()}</ShellHostContext.Provider>
          </ShellCardsContext.Provider>
        </Animated.View>
      </View>
      {modals.map((route, index) => {
        const options = descriptors[route.key].options as WindowsStackOptions;
        const transparent = TRANSPARENT.has(options.presentation as WindowsStackPresentation);
        const top = index === modals.length - 1;
        return (
          <ModalLayer key={route.key} transparent={transparent} tall onDismiss={top ? goBack : undefined} animation={options.animation} testID={`modal-${route.name}`}>
            {!transparent && options.headerShown !== false ? <ScreenHeader {...headerOf(options, route.name, goBack)}/> : null}
            <View style={styles.slot}>{descriptors[route.key].render()}</View>
          </ModalLayer>
        );
      })}
    </LayerHost>
  );
}

type ShellCardsValue = NonNullable<React.ContextType<typeof ShellCardsContext>>;

interface ShellCardProps {
  route: {key: string; name: string};
  options: WindowsStackOptions;
  render: () => ReactNode;
}

/**
 * A card drawn in the tabs' content rather than in the stack's own body:
 * its header row without a back button, since the pane's is the way back,
 * and its screen, arriving with the entrance. The card is no frame of its
 * own: tabs inside it are told of no stack, so they neither take the frame
 * from the tabs it is drawn in nor see the cards under it.
 */
function ShellCard({route, options, render}: ShellCardProps) {
  // A new component for each card pushed, so its mount is the arrival.
  const entrance = useEntrance(route.key, 'card', options.animation, true);
  return (
    <Animated.View style={[styles.slot, entrance]} testID={`card-${route.name}`}>
      {options.headerShown !== false ? <ScreenHeader {...headerOf(options, route.name, undefined, false)}/> : null}
      <ShellCardsContext.Provider value={null}>
        <ShellHostContext.Provider value={null}>{render()}</ShellHostContext.Provider>
      </ShellCardsContext.Provider>
    </Animated.View>
  );
}

/**
 * The header row a screen's options describe: its title or title node, its
 * leading node or back button, its trailing node. Under a pane the back
 * button is the pane's own and none is drawn here, though `headerLeft` is
 * still told there is somewhere to go back to.
 */
function headerOf(options: WindowsStackOptions, name: string, goBack: (() => void) | undefined, drawsBack = true) {
  const title = titleOf(options, name);
  return {
    title,
    titleNode: typeof options.headerTitle === 'function' ? options.headerTitle({children: title}) : undefined,
    leading: options.headerLeft?.({canGoBack: goBack !== undefined || !drawsBack}),
    onBack: options.headerBackVisible === false || !drawsBack ? undefined : goBack,
    trailing: options.headerRight?.({}),
  };
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
