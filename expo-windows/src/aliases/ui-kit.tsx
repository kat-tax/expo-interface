import type {FunctionComponent, ReactElement, ReactNode} from 'react';
import type {ViewStyle} from 'react-native';
import type {IconToken} from 'expo-interface';
import {Children, isValidElement} from 'react';

/** The character a glyph is drawn with: the table keeps code points as hex, a literal character stays itself. */
export function charOf(glyph: string): string {
  return /^[0-9A-Fa-f]{4,5}$/.test(glyph) ? String.fromCodePoint(parseInt(glyph, 16)) : glyph;
}

/** The kit's icon token for a Segoe glyph, for the buttons and menus the aliases draw. */
export function iconOf(glyph: string): IconToken;
export function iconOf(glyph: string | undefined): IconToken | undefined;
export function iconOf(glyph: string | undefined): IconToken | undefined {
  if (!glyph) return undefined;
  // The kit draws a code point given as hex; a literal character becomes its code.
  const code = /^[0-9A-Fa-f]{4,5}$/.test(glyph) ? glyph.toUpperCase() : (glyph.codePointAt(0) as number).toString(16).toUpperCase();
  return {symbol: {windows: code}} as unknown as IconToken;
}

/** A modifier as `@expo/ui` builds one: its kind, and the parameters the call gave. */
export type Modifier = {$type: string; [key: string]: unknown};

type ChildProps = {children?: ReactNode; label?: unknown; title?: unknown; text?: unknown; modifiers?: unknown};

/** The text a node holds — strings and numbers, through the elements' children, labels and titles — joined. */
export function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<ChildProps>(node)) {
    const {children, label, title, text} = node.props;
    const own = [label, title, text].find(value => typeof value === 'string' || typeof value === 'number');
    return own !== undefined ? String(own) : textOf(children);
  }
  return '';
}

/** The elements among a node's children, flattened. */
export function elementsOf(children: ReactNode): ReactElement<ChildProps>[] {
  return Children.toArray(children).filter((child): child is ReactElement<ChildProps> => isValidElement(child));
}

/** The children of the first element of a type among `children`, for slot components. */
export function slotOf(children: ReactNode, type: unknown): ReactNode | undefined {
  return elementsOf(children).find(child => child.type === type)?.props.children;
}

/** The children with the elements of the given types left out. */
export function without(children: ReactNode, ...types: unknown[]): ReactNode[] {
  return Children.toArray(children).filter(child => !isValidElement(child) || !types.includes(child.type));
}

const warned = new Set<string>();

/**
 * A component of another platform: it renders nothing on Windows, and says
 * so once in development, so an import resolves and a screen goes on.
 */
export function elsewhere<P extends object = Record<string, unknown>>(name: string, platforms = "SwiftUI's or Jetpack Compose's"): FunctionComponent<P> {
  function NotOnWindows(): null {
    if (__DEV__ && !warned.has(name)) {
      warned.add(name);
      console.warn(`[expo-windows] ${name} is ${platforms}; it renders nothing on Windows.`);
    }
    return null;
  }
  NotOnWindows.displayName = name;
  return NotOnWindows;
}

/** Forgets which components have warned, for tests. */
export function forgetWarnings(): void {
  warned.clear();
}

export function modifiersOf(value: unknown): Modifier[] {
  return Array.isArray(value) ? value.filter((entry): entry is Modifier => !!entry && typeof entry === 'object' && typeof (entry as Modifier).$type === 'string') : [];
}

/** The modifier of a kind among a view's, the last one when repeated. */
export function modifier(modifiers: unknown, type: string): Modifier | undefined {
  const list = modifiersOf(modifiers);
  for (let index = list.length - 1; index >= 0; index -= 1) if (list[index].$type === type) return list[index];
  return undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function pad(value: unknown, fallback: number): number | undefined {
  return value === 'default' ? fallback : number(value);
}

/**
 * The style the layout modifiers ask for — SwiftUI's frame, padding,
 * cornerRadius, opacity, hidden, offset, zIndex, border, background;
 * Compose's size, width, height, fillMax*, padding, paddingAll, alpha,
 * offset, zIndex, background, border, weight, clip — so a modified view
 * sits and looks on Windows as it would elsewhere. The rest are effects
 * of the platforms' own and are ignored.
 */
export function styleOf(modifiers: unknown): ViewStyle | undefined {
  const style: ViewStyle = {};
  for (const {$type, ...params} of modifiersOf(modifiers)) {
    switch ($type) {
      case 'frame': {
        const {width, height, minWidth, maxWidth, minHeight, maxHeight} = params;
        Object.assign(style, {width: number(width), height: number(height), minWidth: number(minWidth), maxWidth: maxWidth === Infinity ? '100%' : number(maxWidth), minHeight: number(minHeight), maxHeight: maxHeight === Infinity ? '100%' : number(maxHeight)});
        break;
      }
      case 'size':
        Object.assign(style, {width: number(params.width), height: number(params.height)});
        break;
      case 'width':
        style.width = number(params.width);
        break;
      case 'height':
        style.height = number(params.height);
        break;
      case 'fillMaxWidth':
        style.width = '100%';
        break;
      case 'fillMaxHeight':
        style.height = '100%';
        break;
      case 'fillMaxSize':
        Object.assign(style, {width: '100%', height: '100%'});
        break;
      case 'matchParentSize':
        Object.assign(style, {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0});
        break;
      case 'padding': {
        const all = pad(params.all, 16);
        Object.assign(style, {
          paddingTop: pad(params.top, 16) ?? all,
          paddingBottom: pad(params.bottom, 16) ?? all,
          paddingLeft: pad(params.leading ?? params.start, 16) ?? pad(params.horizontal, 16) ?? all,
          paddingRight: pad(params.trailing ?? params.end, 16) ?? pad(params.horizontal, 16) ?? all,
        });
        if (Object.keys(params).length === 0) style.padding = 16;
        break;
      }
      case 'paddingAll':
        style.padding = number(params.all);
        break;
      case 'cornerRadius':
        style.borderRadius = number(params.radius);
        break;
      case 'clip':
        if (typeof params.shape === 'object' && params.shape && 'cornerRadius' in params.shape) style.borderRadius = number((params.shape as {cornerRadius?: unknown}).cornerRadius);
        break;
      case 'opacity':
        style.opacity = number(params.value);
        break;
      case 'alpha':
        style.opacity = number(params.alpha);
        break;
      case 'hidden':
        if (params.hidden !== false) style.display = 'none';
        break;
      case 'offset': {
        const x = number(params.x) ?? 0;
        const y = number(params.y) ?? 0;
        style.transform = [{translateX: x}, {translateY: y}];
        break;
      }
      case 'zIndex':
        style.zIndex = number(params.index);
        break;
      case 'background':
        if (typeof params.color === 'string') style.backgroundColor = params.color;
        break;
      case 'border':
        Object.assign(style, {borderWidth: number(params.width ?? params.borderWidth) ?? 1, borderColor: (params.color ?? params.borderColor) as string | undefined});
        break;
      case 'weight':
        style.flex = number(params.weight);
        break;
    }
  }
  for (const key of Object.keys(style) as (keyof ViewStyle)[]) if (style[key] === undefined) delete style[key];
  return Object.keys(style).length ? style : undefined;
}

/** Whether a `disabled` modifier is on the view. */
export function isDisabled(modifiers: unknown): boolean {
  const found = modifier(modifiers, 'disabled');
  return !!found && found.disabled !== false;
}

/** The tap gesture a view's modifiers attach, if any. */
export function onTapOf(modifiers: unknown): (() => void) | undefined {
  const found = modifier(modifiers, 'onTapGesture') ?? modifier(modifiers, 'clickable');
  const listener = found?.eventListener ?? found?.handler;
  return typeof listener === 'function' ? (listener as () => void) : undefined;
}

/** The `tag` a picker option carries, when it has one. */
export function tagOf(element: ReactElement<ChildProps>): string | number | undefined {
  const found = modifier(element.props.modifiers, 'tag');
  const value = found?.tag ?? found?.value;
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

/** A JavaScript object with the shape of `@expo/ui`'s observable state, for the hooks the packages share. */
export type ObservableState<T> = {
  value: T;
  get(): T;
  set(value: T): void;
  onChange: ((value: T) => void) | null;
  release(): void;
};

export function observable<T>(initial: T): ObservableState<T> {
  let current = initial;
  const state: ObservableState<T> = {
    get value() {
      return current;
    },
    set value(next: T) {
      current = next;
      state.onChange?.(next);
    },
    get: () => current,
    set: next => {
      state.value = next;
    },
    onChange: null,
    release: () => {},
  };
  return state;
}

/** The text an `@expo/ui` text field prop names: a string, or an observable state's value. */
export function valueOf(text: unknown): string | undefined {
  if (typeof text === 'string') return text;
  if (text && typeof text === 'object' && 'value' in text) return String((text as {value: unknown}).value ?? '');
  return undefined;
}

/** Sets an observable state, when the prop is one. */
export function assign(text: unknown, value: string): void {
  if (text && typeof text === 'object' && 'set' in text && typeof (text as {set: unknown}).set === 'function') (text as {set(value: string): void}).set(value);
}
