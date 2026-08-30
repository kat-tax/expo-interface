import {screen} from '@testing-library/react-native';

/**
 * `@expo/ui` components render as `ViewManagerAdapter_ExpoUI_*` host views
 * (`_HostView`, `_ToggleView`, ...) whose props are the payload handed to
 * SwiftUI / Compose. These helpers walk the rendered tree so tests can assert
 * on that payload.
 */
export interface HostNode {
  type: string;
  props: Record<string, any>;
  children: (HostNode | string)[] | null;
}

export function nodes(root: unknown = screen.toJSON()): HostNode[] {
  const out: HostNode[] = [];
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== 'object') return;
    const node = n as HostNode;
    out.push(node);
    node.children?.forEach(visit);
  };
  visit(root);
  return out;
}

/**
 * Type-and-scalar-prop outline of the rendered tree for error messages.
 * Real React Native trees (unlike jest-expo's) hang circular navigation
 * objects and throwing getters off their props, so `JSON.stringify` is out.
 */
function outline(n: unknown, depth = 0): string {
  const pad = '  '.repeat(depth);
  if (n == null) return `${pad}null`;
  if (typeof n === 'string') return `${pad}"${n}"`;
  if (Array.isArray(n)) return n.map(c => outline(c, depth)).join('\n');
  const node = n as HostNode;
  const props: string[] = [];
  for (const key of Object.keys(node.props ?? {})) {
    try {
      const value = node.props[key];
      if (value == null || typeof value === 'function') continue;
      props.push(typeof value === 'object' ? `${key}={…}` : `${key}=${JSON.stringify(value)}`);
    } catch {
      props.push(`${key}=[throws]`);
    }
  }
  const kids = (node.children ?? []).map(c => outline(c, depth + 1));
  return [`${pad}<${node.type} ${props.join(' ')}>`, ...kids].join('\n');
}

/** First host node whose props satisfy `predicate`. Throws when none match. */
export function host(predicate: (props: Record<string, any>) => boolean, root?: unknown): HostNode {
  const match = nodes(root).find(n => predicate(n.props ?? {}));
  if (!match) throw new Error(`No host view matched:\n${outline(screen.toJSON())}`);
  return match;
}

/** SwiftUI / Compose modifier of the given `$type` from a `modifiers` prop. */
export function modifier(props: Record<string, any>, type: string): Record<string, any> | undefined {
  return (props.modifiers as Record<string, any>[] | undefined)?.find(m => m.$type === type);
}

/** Host node carrying a Compose `testID` modifier (Android). */
export function byComposeTestID(testID: string): HostNode {
  return host(props => modifier(props, 'testID')?.testID === testID);
}

/**
 * `headerConfig` payloads of the mounted native stack items. The native stack
 * hands its header options to `ScreenStackItem` as a single `headerConfig`
 * prop (vitest-native's react-native-screens mock keeps it there instead of
 * expanding it into an `RNSScreenStackHeaderConfig` child view).
 */
export function stackHeaders(): Record<string, any>[] {
  return nodes()
    .filter(n => n.type === 'ScreenStackItem')
    .map(n => n.props.headerConfig ?? {});
}
