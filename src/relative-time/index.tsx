import type {RelativeTimeProps} from './types';
import {useEffect, useState} from 'react';
import {Typography} from '../typography';
import {relative} from './shared';

/**
 * A moment as the time since or until it, "5 minutes ago", kept current: it
 * renders again when what it says changes, and nothing else does. The words
 * are the locale's through `Intl.RelativeTimeFormat` where the JavaScript
 * engine has it (every browser); Hermes has none yet, so on iOS, Android and
 * Windows they are English.
 */
export function RelativeTime({date, variant = 'footnote', color = 'secondaryLabel', numeric = 'auto', numberOfLines, testID}: RelativeTimeProps) {
  const time = typeof date === 'number' ? date : date.getTime();
  const [now, setNow] = useState(() => Date.now());
  const {text, next} = relative(time, now, numeric);
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), next);
    return () => clearTimeout(timer);
  }, [time, now, next]);
  return (
    <Typography variant={variant} color={color} numberOfLines={numberOfLines} testID={testID}>
      {text}
    </Typography>
  );
}

export type {RelativeTimeProps} from './types';
