import './tooltip.css';
import type {CSSProperties} from 'react';
import type {TooltipProps} from './types';
import {useId, useSyncExternalStore} from 'react';

/**
 * Whether the browser implements the Interest Invoker API (`interestfor`).
 * When it does, the hint is a real `popover="hint"` (top layer, shown on
 * hover / focus / long-press, dismissed by the browser); otherwise the
 * `title` attribute provides the platform tooltip.
 */
function interestSupported(): boolean {
  return typeof HTMLButtonElement !== 'undefined' && 'interestForElement' in HTMLButtonElement.prototype;
}

/** What a static export's server answers: it has no browser to ask. */
function serverInterestSupported(): boolean {
  return false;
}

/** The answer never changes while the page runs, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/**
 * Whether the browser implements `interestfor`, asked at render rather than
 * when the module loads. A static export's HTML has the `title` fallback,
 * hydration renders the server's answer to match it, and the render right
 * after takes the hint where the browser has the API.
 */
function useInterestSupported(): boolean {
  return useSyncExternalStore(noSubscription, interestSupported, serverInterestSupported);
}

export function Tooltip({text, children, testID}: TooltipProps) {
  const ident = `ui-tooltip-${useId().replace(/[^A-Za-z0-9_-]/g, '_')}`;
  const anchor = `--${ident}`;
  const interest = useInterestSupported();
  return (
    <>
      <button
        type="button"
        className="ui-tooltip"
        title={interest ? undefined : text}
        style={{anchorName: anchor} as CSSProperties}
        data-testid={testID}
        {...(interest ? {interestfor: ident} : null)}>
        {children}
      </button>
      {interest ? (
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
