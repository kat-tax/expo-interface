import type {ViewProps} from 'react-native';

/**
 * Whether a control the card reveals under a pointer is shown, and the
 * props the card's box takes to find out. iOS and Android: nothing hovers
 * for certain (a phone has no pointer, and an iPad's may never arrive), so
 * what a pointer would reveal stays drawn.
 */
export function useReveal(): {revealed: boolean; props: ViewProps} {
  return {revealed: true, props: {}};
}
