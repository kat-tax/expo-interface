import type {KeyEvent} from './index';
import {useEffect, useRef} from 'react';

/** A key with its modifiers, as `Ctrl+Shift+S` names one. */
export interface Shortcut {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  /** The key as react-native-windows reports it: a lower-case letter, or a name (`F2`, `ArrowLeft`, `Delete`). */
  key: string;
}

const MODIFIERS: Record<string, 'ctrl' | 'shift' | 'alt' | 'meta'> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  shift: 'shift',
  alt: 'alt',
  meta: 'meta',
  win: 'meta',
  cmd: 'meta',
};

/** The names a shortcut may spell a key by, to the name the key event carries. */
const KEYS: Record<string, string> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  esc: 'Escape',
  escape: 'Escape',
  enter: 'Enter',
  return: 'Enter',
  space: ' ',
  tab: 'Tab',
  del: 'Delete',
  delete: 'Delete',
  backspace: 'Backspace',
};

function keyName(key: string): string {
  return KEYS[key.toLowerCase()] ?? (key.length === 1 ? key.toLowerCase() : key);
}

/** `Ctrl+Shift+S`, `Alt+Left`, `F2`, `Ctrl+Enter`: the modifiers and the key, in any order and case. */
export function parseShortcut(text: string): Shortcut {
  const shortcut: Shortcut = {ctrl: false, shift: false, alt: false, meta: false, key: ''};
  for (const part of text.split('+')) {
    const word = part.trim();
    if (!word) continue;
    const modifier = MODIFIERS[word.toLowerCase()];
    if (modifier) shortcut[modifier] = true;
    else shortcut.key = keyName(word);
  }
  return shortcut;
}

/** Whether a key event is the shortcut: the key, and exactly its modifiers. */
export function matchesShortcut(event: KeyEvent['nativeEvent'], shortcut: Shortcut): boolean {
  return (
    keyName(event.key) === shortcut.key &&
    Boolean(event.ctrlKey) === shortcut.ctrl &&
    Boolean(event.shiftKey) === shortcut.shift &&
    Boolean(event.altKey) === shortcut.alt &&
    Boolean(event.metaKey) === shortcut.meta
  );
}

interface Binding {
  shortcut: Shortcut;
  handler: () => void;
}

/** What is bound right now, in binding order; the last bound wins a key, as the innermost mounted. */
const bindings = new Set<Binding>();

/** Binds a handler to a shortcut until the returned function is called. */
export function bindShortcut(text: string, handler: () => void): () => void {
  const binding = {shortcut: parseShortcut(text), handler};
  bindings.add(binding);
  return () => {
    bindings.delete(binding);
  };
}

/**
 * Runs the handler bound to the key the event carries, and says whether
 * one was. The kit's `LayerHost` — the window — asks first, before Escape
 * and the back keys, for every key that reaches it.
 */
export function dispatchShortcut(event: KeyEvent): boolean {
  let matched: Binding | null = null;
  for (const binding of bindings) {
    if (matchesShortcut(event.nativeEvent, binding.shortcut)) matched = binding;
  }
  if (!matched) return false;
  matched.handler();
  return true;
}

/**
 * Binds `handler` to a shortcut — `Ctrl+S`, `Ctrl+Shift+N`, `F2` — for as
 * long as the component is mounted and `enabled`, wherever the focus is in
 * the window: the keys reach the kit's stack (a `LayerHost`) from any
 * focused control. Of two bindings to one shortcut, the later mounted
 * wins, so a screen's binding is in front of its layout's.
 */
export function useKeyboardShortcut(shortcut: string | null | undefined, handler: () => void, enabled = true): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!shortcut || !enabled) return undefined;
    return bindShortcut(shortcut, () => latest.current());
  }, [shortcut, enabled]);
}
