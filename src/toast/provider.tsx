import type {PropsWithChildren} from 'react';
import type {ToastProps} from './types';
import {createContext, useContext, useMemo, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {useNativeTabs} from '../tabs/context';
import {AppToastFloorContext, AppToastInsetContext, ToastInsetContext} from './context';
import {Toast} from '.';

/** A toast to show, as `useToast().show()` takes it. */
export type ToastOptions = Pick<ToastProps, 'message' | 'action' | 'duration'>;

/** The app's toasts (see `useToast`). */
export interface ToastApi {
  /** Shows a toast once the ones before it have gone, and answers its id. */
  show(toast: ToastOptions | string): string;
  /** Takes a toast away, showing or waiting; the one showing when no id is given. */
  dismiss(id?: string): void;
}

const ToastQueueContext = createContext<ToastApi | null>(null);

/** One counter for every provider, so an id names one toast wherever it was shown. */
let shown = 0;

/**
 * The app's toasts, one at a time: `show` queues a toast, and each is
 * shown for its duration (or until its action is taken) before the next.
 * A toast is the platform's (Material's `Snackbar` on Android, the drawn
 * capsule on iOS and web, WinUI's `InfoBar` on Windows), shown at the foot
 * of the provider's area above the bottom safe area (the home indicator,
 * Android's navigation bar). Around `Tabs` on iOS and Android it also
 * stands above the tab bar, and above its bottom accessory on iOS 26,
 * except while the tabs are hidden or a stack around them shows a screen
 * over them. The bar counts at its standard height (`inset.bottomTab`),
 * not measured, so where the platform draws it shorter or not at the
 * bottom (iPadOS 18 and later draw it at the top of a regular-width
 * window) the toast stands higher than the bar needs. Put the provider
 * around the app's navigation. A `Screen`'s fab lifts above it as it
 * lifts above a toast of its own, and so does the tabs' floating action.
 */
export function ToastProvider({children}: PropsWithChildren) {
  const [queue, setQueue] = useState<readonly (ToastOptions & {id: string})[]>([]);
  const [inset, setInset] = useState(0);
  // What a bar under the provider (the native tab bar) takes of its bottom
  // edge, above the safe area. The safe area is read from the context, so a
  // provider outside a `SafeAreaProvider` stands on its edge.
  const [bar, setBar] = useState(0);
  const safeArea = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // Android's tab host keeps its screens above the navigation bar itself, so
  // a provider in a tab's layout stands on the host's bottom, as a `Screen`
  // there does; the context still holds the window's inset.
  const underTabs = useNativeTabs();
  const safeBottom = Platform.OS === 'android' && underTabs ? 0 : safeArea;
  const api = useMemo<ToastApi>(() => ({
    show(toast) {
      shown += 1;
      const id = `toast-${shown}`;
      setQueue(previous => [...previous, {...(typeof toast === 'string' ? {message: toast} : toast), id}]);
      return id;
    },
    dismiss(id) {
      setQueue(previous => (id == null ? previous.slice(1) : previous.filter(toast => toast.id !== id)));
    },
  }), []);
  const current = queue[0];
  return (
    <ToastQueueContext.Provider value={api}>
      <AppToastFloorContext.Provider value={setBar}>
        <View style={styles.root}>
          <AppToastInsetContext.Provider value={inset}>{children}</AppToastInsetContext.Provider>
          {current ? (
            // The area above the floor: the toast's own slot sits at its foot,
            // as it sits at a screen's when it is used in one.
            <View testID="toast-floor" style={[styles.floor, {bottom: safeBottom + bar}]}>
              <ToastInsetContext.Provider value={setInset}>
                <Toast
                  // A new toast is a new control: Compose shows a snackbar per show, and the drawn one starts its time again.
                  key={current.id}
                  visible
                  message={current.message}
                  action={current.action}
                  duration={current.duration}
                  onDismiss={() => api.dismiss(current.id)}
                />
              </ToastInsetContext.Provider>
            </View>
          ) : null}
        </View>
      </AppToastFloorContext.Provider>
    </ToastQueueContext.Provider>
  );
}

/** The app's toasts: `show` and `dismiss`. Needs a `ToastProvider` above. */
export function useToast(): ToastApi {
  const api = useContext(ToastQueueContext);
  if (!api) throw new Error('useToast needs a ToastProvider above it.');
  return api;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  floor: {
    ...StyleSheet.absoluteFill,
    // The box spans the area; only the toast in it takes presses.
    pointerEvents: 'box-none',
  },
});
