import type {WindowChrome, WindowChromeOptions} from './chrome';
import {useEffect, useSyncExternalStore} from 'react';
import {requireOptionalNativeModule} from 'expo-modules-core';
import {useColorScheme} from '../scheme';

export type {WindowChrome, WindowChromeOptions};

/** The runtime's window module (`expo-windows`), when the app runs on it. */
interface WindowsModule {
  setWindowChromeAsync(options: {extend: boolean; theme: 'light' | 'dark'}): Promise<boolean>;
  getTitleBarInsetsAsync(): Promise<WindowChrome['insets']>;
  setDragRegion(region: {x: number; y: number; width: number; height: number}): void;
}

const NONE: WindowChrome = {extended: false, insets: {left: 0, right: 0, height: 0}};
const NO_REGION = {x: 0, y: 0, width: 0, height: 0};

/** The chrome as it stands, for every header to read. */
let chrome: WindowChrome = NONE;
const listeners = new Set<() => void>();

function publish(next: WindowChrome) {
  chrome = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function runtime(): WindowsModule | null {
  return requireOptionalNativeModule<WindowsModule>('ExpoWindows');
}

function leaveTheChrome() {
  // The title bar stays as it is: the runtime said no, or is not there.
}

/**
 * Windows, on `expo-windows`: extends the content into the title bar — the
 * caption buttons, drawn for the scheme, over the app's own top row and no
 * system title — and tells the kit's headers the insets to leave clear; the
 * root stack's header becomes the region that drags the window. Asked again
 * with `extend: false`, the system title bar comes back. Nothing without the
 * runtime, or where the Windows App SDK cannot customize the title bar.
 */
export function useWindowChrome({extend}: WindowChromeOptions): void {
  const theme = useColorScheme();
  useEffect(() => {
    const windows = runtime();
    if (!windows) return undefined;
    let current = true;
    windows
      .setWindowChromeAsync({extend, theme})
      .then(async taken => {
        const extended = extend && taken;
        const insets = extended ? await windows.getTitleBarInsetsAsync() : NONE.insets;
        if (!current) return;
        // Extended, the system makes the whole top band the drag region until told
        // otherwise, which would swallow presses on a pane's toggle or a top tab bar
        // under it: nothing drags the window until a header offers itself.
        if (extended) windows.setDragRegion(NO_REGION);
        publish({extended, insets});
      })
      .catch(leaveTheChrome);
    return () => {
      current = false;
    };
  }, [extend, theme]);
}

/** The window's chrome as it stands: whether the content is in the title bar, and the caption area to leave clear. */
export function useWindowChromeState(): WindowChrome {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

function snapshot(): WindowChrome {
  return chrome;
}

/** The rectangle, in points from the window's top-left, that drags the window while the content is in the title bar. */
export function setDragRegion(region: {x: number; y: number; width: number; height: number}): void {
  runtime()?.setDragRegion(region);
}

/** What a view can measure itself with: React Native's `measureInWindow`. */
export interface Measurable {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

/** Measures a header's row in the window and makes it the drag region, minus the caption buttons' room on either side. */
export function reportDragRegion(view: Measurable | null, insets: {left: number; right: number}): void {
  view?.measureInWindow((x, y, width, height) => {
    setDragRegion({x: x + insets.left, y, width: Math.max(0, width - insets.left - insets.right), height});
  });
}
