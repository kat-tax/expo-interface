import type {RelativeTimeOptions, RelativeTimeProps} from './types';
import {useEffect, useState} from 'react';
import {Typography} from '../typography';
import {usePageLanguage} from './language';
import {relative} from './shared';

/**
 * A moment as the time since or until it, "5 minutes ago", as a string kept
 * current: the component calling it renders again as the words may change
 * (at 45 seconds for "now", then every half unit). For text that cannot hold
 * a view: a `ListItem`'s `value`, a `Card`'s `subtitle`, a label. The words
 * are `locale`'s, or the page's language on the web, through
 * `Intl.RelativeTimeFormat` where the JavaScript engine has it (every
 * browser); Hermes has none, so on iOS, Android and Windows they are English
 * unless the app installs a polyfill for it.
 */
export function useRelativeTime(date: Date | number, {numeric = 'auto', locale}: RelativeTimeOptions = {}): string {
  const time = typeof date === 'number' ? date : date.getTime();
  const page = usePageLanguage();
  const [clock, setClock] = useState(() => ({time, now: Date.now()}));
  // A new moment is said from when it arrives, not from the last tick.
  if (!Object.is(clock.time, time)) setClock(() => ({time, now: Date.now()}));
  const {text, next} = relative(time, clock.now, numeric, locale ?? page);
  useEffect(() => {
    const timer = setTimeout(() => setClock({time, now: Date.now()}), next);
    return () => clearTimeout(timer);
  }, [time, clock.now, next]);
  return text;
}

/**
 * A moment as the time since or until it, "5 minutes ago", kept current:
 * `useRelativeTime` in a `Typography`, which renders again when what it says
 * may change, and nothing else does.
 */
export function RelativeTime({date, numeric, locale, variant = 'footnote', color = 'secondaryLabel', numberOfLines, testID}: RelativeTimeProps) {
  const text = useRelativeTime(date, {numeric, locale});
  return (
    <Typography variant={variant} color={color} numberOfLines={numberOfLines} testID={testID}>
      {text}
    </Typography>
  );
}

export type {RelativeTimeOptions, RelativeTimeProps} from './types';
