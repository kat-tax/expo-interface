import type {ReactNode} from 'react';
import {createContext} from 'react';

/**
 * Windows: the WinUI `NavigationView` is the window's frame, and the content
 * navigates inside it, as WinUI's own `Frame` does in a `NavigationView`. A
 * stack above the kit's `Tabs` keeps them mounted under a card pushed over
 * them and hands the card down; the pane stays, its back button lights up,
 * and the card is drawn where the tab's screens go. This is what the stack
 * hands down.
 */
export interface ShellCards {
  /** The card in front, with its header row, ready to draw in the tabs' content. */
  card: ReactNode;
  /** Pops what is in front: the pane's back button. */
  goBack(): void;
  /** Pops every card over the tabs: a selection in the pane leaves the drilled-in screens. */
  popAll(): void;
}

export const ShellCardsContext = createContext<ShellCards | null>(null);

/**
 * How `Tabs` tell the stack above that the route they are in holds a
 * `NavigationView`: while it does, a push keeps the route mounted and lays
 * the card over the tabs. The kit's Windows stack provides one around each
 * route it draws; elsewhere there is nothing to tell.
 */
export const ShellHostContext = createContext<((hosts: boolean) => void) | null>(null);

/**
 * Where the pane's back button goes: the innermost stack under the tabs
 * that can pop publishes its way back here, and takes it away when it is at
 * its root. A store outside React state, so a push in a tab re-renders the
 * bar alone. The bar draws no back button of the kit's own while a stack has
 * the pane's, which is why a stack reads whether the store is there.
 */
export interface BackStore {
  /** Publishes a stack's way back, or takes it away (`null`). */
  set(id: string, goBack: (() => void) | null): void;
  /** The way back of the stack in front: the last to publish. */
  get(): (() => void) | null;
  subscribe(listener: () => void): () => void;
}

export const BackStoreContext = createContext<BackStore | null>(null);

/**
 * Builds the store for one `Tabs`. Of two stacks that can pop, one inside
 * the other, the inner one published later and is the one in front; when it
 * reaches its root the outer one's way back is current again.
 */
export function createBackStore(): BackStore {
  const entries = new Map<string, {order: number; goBack: () => void}>();
  let order = 0;
  let current: (() => void) | null = null;
  const listeners = new Set<() => void>();
  const refresh = () => {
    let front: {order: number; goBack: () => void} | null = null;
    for (const entry of entries.values()) {
      if (!front || entry.order > front.order) front = entry;
    }
    const next = front?.goBack ?? null;
    if (next === current) return;
    current = next;
    for (const listener of listeners) listener();
  };
  return {
    set(id, goBack) {
      if (goBack) entries.set(id, {order: order++, goBack});
      else entries.delete(id);
      refresh();
    },
    get: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
