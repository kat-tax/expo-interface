import {screen} from '@testing-library/react-native';

/**
 * `@expo/ui` components render as `ViewManagerAdapter_ExpoUI` host views whose
 * props are the payload handed to SwiftUI / Compose. These helpers walk the
 * rendered tree so tests can assert on that payload.
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

/** First host node whose props satisfy `predicate`. Throws when none match. */
export function host(predicate: (props: Record<string, any>) => boolean, root?: unknown): HostNode {
  const match = nodes(root).find(n => predicate(n.props ?? {}));
  if (!match) throw new Error(`No host view matched:\n${JSON.stringify(screen.toJSON(), null, 2)}`);
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
