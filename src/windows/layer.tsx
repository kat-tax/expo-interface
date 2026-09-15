import type {ReactNode} from 'react';
import type {PointerEvent} from 'react-native';
import {createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {keyHandlers} from './index';

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
export function LayerHost({children, onBack, testID}: LayerHostProps) {
  const [layers, setLayers] = useState<ReadonlyMap<string, ReactNode>>(() => new Map());
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
      const {key, altKey} = event.nativeEvent;
      if (key === 'Escape') {
        registry.dismissals.at(-1)?.();
      } else if ((key === 'ArrowLeft' && altKey) || key === 'BrowserBack' || key === 'GoBack') {
        onBack?.();
      }
    },
  });
  const onPointerDown = (event: PointerEvent) => {
    if (event.nativeEvent.button === BACK_BUTTON) onBack?.();
  };
  return (
    <LayerContext.Provider value={registry}>
      <View style={styles.host} onPointerDown={onPointerDown} testID={testID} {...keyboard}>
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
