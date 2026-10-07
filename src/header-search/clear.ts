import {useEffect, useEffectEvent} from 'react';

/**
 * Tells the app its query is empty once the search goes, so whatever the
 * query filtered is whole again without the app clearing it by hand.
 */
export function useClearOnUnmount(onChangeText: ((text: string) => void) | undefined): void {
  const clear = useEffectEvent(() => onChangeText?.(''));
  useEffect(() => () => clear(), []);
}
