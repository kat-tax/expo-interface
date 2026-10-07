import {createContext, useContext, useEffect} from 'react';

/**
 * Where a toast tells the screen how much of its bottom edge it covers, so
 * what floats there (the screen's `Fab`) can lift above it. `Screen`
 * provides it; outside a screen the report goes nowhere.
 */
export const ToastInsetContext = createContext<(height: number) => void>(() => {});

/**
 * What the app's toast (`ToastProvider`) covers of the bottom edge, for a
 * `Screen` under the provider to lift its fab above, as it lifts it above a
 * toast of its own. Zero without one.
 */
export const AppToastInsetContext = createContext(0);

/**
 * Reports a toast's height from the screen's bottom edge while it shows, and
 * nothing once it goes.
 */
export function useToastInset(height: number) {
  const report = useContext(ToastInsetContext);
  useEffect(() => {
    report(height);
    return () => report(0);
  }, [height, report]);
}
