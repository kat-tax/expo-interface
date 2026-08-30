import './tooltip.css';
import type {CSSProperties} from 'react';
import type {TooltipProps} from './types';
import {useId} from 'react';

/**
 * Whether the browser implements the Interest Invoker API (`interestfor`).
 * When it does, the hint is a real `popover="hint"` (top layer, shown on
 * hover / focus / long-press, dismissed by the browser); otherwise the
 * `title` attribute provides the platform tooltip.
 */
const INTEREST_SUPPORTED =
  typeof HTMLButtonElement !== 'undefined' && 'interestForElement' in HTMLButtonElement.prototype;

export function Tooltip({text, children, testID}: TooltipProps) {
  const ident = `ui-tooltip-${useId().replace(/[^A-Za-z0-9_-]/g, '_')}`;
  const anchor = `--${ident}`;
  return (
    <>
      <button
        type="button"
        className="ui-tooltip"
        title={INTEREST_SUPPORTED ? undefined : text}
        style={{anchorName: anchor} as CSSProperties}
        data-testid={testID}
        {...(INTEREST_SUPPORTED ? {interestfor: ident} : null)}>
        {children}
      </button>
      {INTEREST_SUPPORTED ? (
        <div
          id={ident}
          role="tooltip"
          popover="hint"
          className="ui-tooltip__hint"
          style={{positionAnchor: anchor} as CSSProperties}>
          {text}
        </div>
      ) : null}
    </>
  );
}
