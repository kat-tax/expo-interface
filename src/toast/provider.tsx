import type {PropsWithChildren} from 'react';
import type {ToastProps} from './types';
import {createContext, useContext, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppToastInsetContext, ToastInsetContext} from './context';
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
 * capsule on iOS, web and Windows), shown at the foot of the provider's
 * area, so put the provider around the app's navigation. A `Screen`'s fab
 * lifts above it as it lifts above a toast of its own.
 */
export function ToastProvider({children}: PropsWithChildren) {
  const [queue, setQueue] = useState<readonly (ToastOptions & {id: string})[]>([]);
  const [inset, setInset] = useState(0);
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
      <View style={styles.root}>
        <AppToastInsetContext.Provider value={inset}>{children}</AppToastInsetContext.Provider>
        {current ? (
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
        ) : null}
      </View>
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
});
