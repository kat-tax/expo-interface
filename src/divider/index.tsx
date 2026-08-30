import './divider.css';
import type {CSSProperties} from 'react';
import type {DividerProps} from './types';

/**
 * On web the rule is a real `<hr>` element colored through the
 * `--ui-divider-color` custom property (the theme `separator` by default).
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const style: Record<string, string | number> = {};
  if (color) style['--ui-divider-color'] = color;
  if (inset) style[vertical ? 'marginTop' : 'marginLeft'] = inset;
  return (
    <hr
      className={['ui-divider', vertical && 'ui-divider--vertical'].filter(Boolean).join(' ')}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      style={style as CSSProperties}
      data-testid={testID}
    />
  );
}
