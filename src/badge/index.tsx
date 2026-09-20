import './badge.css';
import type {CSSProperties} from 'react';
import type {BadgeProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {onAccent} from '../accent';
import {flatten, theme} from '../theme';
import {BADGE_SIZE, badgeLabel, badgeText} from './shared';

/**
 * On web the badge is a `<span>` carrying its own accessible name, so a screen
 * reader says "3 new" rather than reading a bare number out of the middle of a
 * row. The geometry comes from `shared.ts` as custom properties, so it measures
 * the same here as it does on the other three platforms.
 */
export function Badge(props: BadgeProps) {
  const text = badgeText(props);
  if (text === null) return null;
  const {dot, color, textColor, testID, style} = props;
  const fill = color ?? (theme.destructive as string);
  const vars = {
    '--ui-badge-size': `${dot ? BADGE_SIZE.dot : BADGE_SIZE.count}px`,
    '--ui-badge-fill': fill,
    '--ui-badge-on-fill': textColor ?? onAccent(fill),
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <span
      className={dot ? 'ui-badge ui-badge--dot' : 'ui-badge'}
      style={vars}
      role="status"
      aria-label={badgeLabel(props, text)}
      data-testid={testID}>
      {/* The number is hidden from the reader: the name above says it better. */}
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
