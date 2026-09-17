import type {ReactNode} from 'react';
import type {PointerEvent} from 'react-native';
import {createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import {keyHandlers} from './index';
import {dispatchShortcut} from './shortcuts';

/** react-native-windows' `focus` command on a view: what gives the window's keys a target before anything is clicked. */
const ViewCommands = codegenNativeCommands<{focus: (view: View) => void}>({supportedCommands: ['focus']});

/** react-native-windows' view props for a container that takes the focus without drawing a ring. */
const FOCUS_HOLDER = {focusable: true, enableFocusRing: false} as object;

interface LayerRegistry {
  mount(id: string, node: ReactNode): void;
  unmount(id: string): void;
  /** Keeps a layer's dismiss for Escape; the last one registered is the topmost. */
  dismissable(dismiss: () => void): () => void;
  /** The dismisses registered, in mounting order. */
  dismissals: (() => void)[];
}

const LayerContext = createContext<LayerRegistry | null>(null);

/** The mouse's back button, as pointer events number it. */
const BACK_BUTTON = 3;

export interface LayerHostProps {
  children?: ReactNode;
  /**
   * Asked on Alt+Left, the keyboard's back key and the mouse's back button,
   * wherever the focus is under the host: the stack pops.
   */
  onBack?: () => void;
  /**
   * Takes the keyboard focus when it mounts, so the window's keys — a
   * shortcut, Escape, the back keys — have a target before anything is
   * clicked. For the root host; a nested one leaves the focus where it is.
   */
  takesFocus?: boolean;
  testID?: string;
}

/**
 * Hosts layers over its children: whatever a `Layer` below it renders is
 * drawn here, over everything the host holds, in the order the layers
 * mounted. The kit's Windows stack is a host, so a sheet or a dialog drawn
 * in React Native covers the whole window without React Native's `Modal`,
 * which cannot hold a XAML island on react-native-windows 0.84.
 *
 * The host is also where the window's keys land: a key event bubbles from
 * the focused control to the host whether the control is in the content or
 * in a layer, so Escape dismisses the topmost dismissable layer from
 * anywhere, and the back keys go to `onBack`.
 *
 * A layer's content renders in the host's place in the tree, not its own:
 * it sees the host's contexts (the accent, the scheme), not those of the
 * component that mounted it — the limit React Native's own portals share.
 */
export function LayerHost({children, onBack, takesFocus = false, testID}: LayerHostProps) {
  const [layers, setLayers] = useState<ReadonlyMap<string, ReactNode>>(() => new Map());
  const root = useRef<View>(null);
  useEffect(() => {
    if (!takesFocus) return;
    try {
      // The view is mounted by the time the effect runs.
      ViewCommands.focus(root.current as View);
    } catch {
      // A renderer without the command (the test harness) leaves the focus where it is.
    }
  }, [takesFocus]);
  const registry = useMemo<LayerRegistry>(
    () => ({
      mount(id, node) {
        setLayers(previous => new Map(previous).set(id, node));
      },
      unmount(id) {
        setLayers(previous => {
          const next = new Map(previous);
          next.delete(id);
          return next;
        });
      },
      dismissable(dismiss) {
        registry.dismissals = [...registry.dismissals, dismiss];
        return () => {
          registry.dismissals = registry.dismissals.filter(entry => entry !== dismiss);
        };
      },
      dismissals: [],
    }),
    [],
  );
  const keyboard = keyHandlers({
    onKeyDown: event => {
      // A key handled here goes no further: a nested stack's host is inside the root's, and the key bubbles to both.
      const handled = () => event.stopPropagation?.();
      // A bound shortcut first: Ctrl+S on a screen's binding, before the window's own keys.
      if (dispatchShortcut(event)) return handled();
      const {key, altKey} = event.nativeEvent;
      if (key === 'Escape') {
        const dismiss = registry.dismissals.at(-1);
        if (dismiss) {
          dismiss();
          handled();
        }
      } else if (((key === 'ArrowLeft' && altKey) || key === 'BrowserBack' || key === 'GoBack') && onBack) {
        onBack();
        handled();
      }
    },
  });
  const onPointerDown = (event: PointerEvent) => {
    if (event.nativeEvent.button === BACK_BUTTON && onBack) {
      onBack();
      event.stopPropagation?.();
    }
  };
  return (
    <LayerContext.Provider value={registry}>
      <View ref={root} style={styles.host} onPointerDown={onPointerDown} testID={testID} {...(takesFocus ? FOCUS_HOLDER : {})} {...keyboard}>
        {children}
        {[...layers].map(([id, node]) => (
          <View key={id} style={StyleSheet.absoluteFill}>
            {node}
          </View>
        ))}
      </View>
    </LayerContext.Provider>
  );
}

/**
 * Renders its children in the nearest `LayerHost`, over everything there.
 * Without a host — a sheet used outside the kit's stack — the children are
 * drawn in place, over the nearest positioned ancestor.
 */
export function Layer({children}: {children: ReactNode}) {
  const registry = useContext(LayerContext);
  const id = useId();
  useLayoutEffect(() => {
    if (!registry) return undefined;
    registry.mount(id, children);
    return () => registry.unmount(id);
  }, [registry, id, children]);
  if (registry) return null;
  return <View style={StyleSheet.absoluteFill}>{children}</View>;
}

/**
 * Registers `dismiss` with the host for Escape while mounted. Returns
 * whether a host took it — when none did, the caller handles Escape itself.
 */
export function useLayerDismiss(dismiss: (() => void) | undefined): boolean {
  const registry = useContext(LayerContext);
  useEffect(() => {
    if (!registry || !dismiss) return undefined;
    return registry.dismissable(dismiss);
  }, [registry, dismiss]);
  return registry !== null;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
