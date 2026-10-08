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
 * Where a bar along the app's bottom edge (the platform's tab bar under
 * `Tabs`, with its bottom accessory on iOS 26) tells the `ToastProvider`
 * around it how much of that edge it takes, above the safe area, so the
 * app's toast stands above it. Outside a provider the report goes nowhere.
 */
export const AppToastFloorContext = createContext<(height: number) => void>(() => {});

/**
 * Reports what a bar takes of the app's bottom edge to the `ToastProvider`
 * around it while it is mounted, and nothing once it goes.
 */
export function useAppToastFloor(height: number) {
  const report = useContext(AppToastFloorContext);
  useEffect(() => {
    report(height);
    return () => report(0);
  }, [height, report]);
}

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
