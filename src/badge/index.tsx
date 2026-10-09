import './badge.css';
import type {CSSProperties, HTMLAttributes} from 'react';
import type {BadgeProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {flatten} from '../theme';
import {useBadgeColors} from './colors';
import {BADGE_SIZE, badgeLabel, badgeText} from './shared';

/**
 * On web the badge is a `<span>` carrying its own accessible name, so a screen
 * reader says "3 new" rather than reading a bare number out of the middle of a
 * row; with a `label` of `null` it is hidden from assistive technology, for a
 * parent that speaks for it. The geometry comes from `shared.ts` as custom
 * properties, so it measures the same here as it does on the other three
 * platforms.
 */
export function Badge(props: BadgeProps) {
  const text = badgeText(props);
  const {fill, content} = useBadgeColors(props);
  if (text === null) return null;
  const {dot, testID, style} = props;
  const vars = {
    '--ui-badge-size': `${dot ? BADGE_SIZE.dot : BADGE_SIZE.count}px`,
    '--ui-badge-fill': fill,
    '--ui-badge-on-fill': content,
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  // A badge its parent speaks for is hidden from assistive technology
  // altogether; any other names itself.
  const announced: HTMLAttributes<HTMLSpanElement> = props.label === null
    ? {'aria-hidden': true}
    : {role: 'status', 'aria-label': badgeLabel(props, text)};
  return (
    <span
      className={['ui-badge', dot && 'ui-badge--dot', props.pulse && 'ui-badge--pulse'].filter(Boolean).join(' ')}
      style={vars}
      {...announced}
      data-testid={testID}>
      {/* The number is hidden from the reader: the name above says it better. */}
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
