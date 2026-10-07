import type {HostNode} from 'expo-vitest/native';
import {nodes} from 'expo-vitest/native';

/** The `@expo/ui` host view, as the native test renderer names it. */
export const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

/** Every host in the rendered tree, in tree order. */
export function hosts(): HostNode[] {
  return nodes().filter(n => n.type === HOST);
}

/**
 * Which axes a host sizes to its content, read back the way both native
 * hosts carry it: one prop per axis. `{vertical: true}` is the default host
 * (the width of its container), `{vertical: true, horizontal: true}` one
 * sized to its content, `{horizontal: true}` one the height of its row.
 */
export function hostFit(node: HostNode): {vertical?: boolean; horizontal?: boolean} {
  const fit: {vertical?: boolean; horizontal?: boolean} = {};
  if (node.props.matchContentsVertical) fit.vertical = true;
  if (node.props.matchContentsHorizontal) fit.horizontal = true;
  return fit;
}
