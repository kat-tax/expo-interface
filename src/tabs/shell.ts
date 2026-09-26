import type {ReactNode} from 'react';
import type {Transition} from '../windows/motion';
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
  /** The card in front, with its header row and its motion, ready to draw in the tabs' content; none once the last card is on its way out. */
  card: ReactNode | null;
  /** A card on its way out, drawn over or under the content until its motion ends. */
  leaving: ReactNode | null;
  /** The card leaving is over the content (it recedes on the way back) rather than under a card that came over it. */
  leavingOnTop: boolean;
  /** The motion the tabs' own content returns with once the last card leaves, or none while a card is drawn. */
  returning: Transition | null;
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

/** A stack's ways back, for the pane: one step, or all the way to its root. */
export interface WayBack {
  goBack(): void;
  popToTop(): void;
}

/**
 * Where the pane's back button goes: the innermost stack under the tabs
 * that can pop publishes its ways back here, and takes them away when it is
 * at its root. A store outside React state, so a push in a tab re-renders
 * the bar alone. The bar draws no back button of the kit's own while a
 * stack has the pane's, which is why a stack reads whether the store is
 * there.
 */
export interface BackStore {
  /** Publishes a stack's ways back, or takes them away (`null`). */
  set(id: string, wayBack: WayBack | null): void;
  /** The ways back of the stack in front: the last to publish. */
  get(): WayBack | null;
  subscribe(listener: () => void): () => void;
}

export const BackStoreContext = createContext<BackStore | null>(null);

/**
 * Builds the store for one `Tabs`. Of two stacks that can pop, one inside
 * the other, the inner one published later and is the one in front; when it
 * reaches its root the outer one's ways back are current again.
 */
export function createBackStore(): BackStore {
  const entries = new Map<string, {order: number; wayBack: WayBack}>();
  let order = 0;
  let current: WayBack | null = null;
  const listeners = new Set<() => void>();
  const refresh = () => {
    let front: {order: number; wayBack: WayBack} | null = null;
    for (const entry of entries.values()) {
      if (!front || entry.order > front.order) front = entry;
    }
    const next = front?.wayBack ?? null;
    if (next === current) return;
    current = next;
    for (const listener of listeners) listener();
  };
  return {
    set(id, wayBack) {
      if (wayBack) entries.set(id, {order: order++, wayBack});
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
