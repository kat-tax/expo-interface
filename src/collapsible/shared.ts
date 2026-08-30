import {useCallback, useState} from 'react';

/**
 * Bridges controlled and uncontrolled expansion, mirroring `useSelectedValue`.
 */
export function useExpanded(
  expanded: boolean | undefined,
  defaultExpanded: boolean,
  onChange: ((expanded: boolean) => void) | undefined,
): [boolean, (next: boolean) => void] {
  const [internal, setInternal] = useState(defaultExpanded);
  const current = expanded ?? internal;
  const setExpanded = useCallback(
    (next: boolean) => {
      if (expanded === undefined) setInternal(next);
      onChange?.(next);
    },
    [expanded, onChange],
  );
  return [current, setExpanded];
}
