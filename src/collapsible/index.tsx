import './collapsible.css';
import type {SyntheticEvent} from 'react';
import type {CollapsibleProps} from './types';
import {Label} from '../typography';
import {useExpanded} from './shared';

/**
 * On web the disclosure is a real `<details>` element: the header is its
 * `<summary>` with a trailing chevron that rotates while open, mirroring the
 * iOS `DisclosureGroup` row.
 */
export function Collapsible({
  label,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  testID,
}: CollapsibleProps) {
  const [open, setOpen] = useExpanded(expanded, defaultExpanded, onExpandedChange);
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const next = event.currentTarget.open;
    if (next === open) return;
    // Controlled: snap the DOM back to the prop so `expanded` stays the
    // source of truth — React re-applies the parent's decision on the next
    // render, or the element stays put when the change was ignored.
    if (expanded !== undefined) event.currentTarget.open = open;
    setOpen(next);
  };
  return (
    <details className="ui-collapsible" open={open} onToggle={onToggle} data-testid={testID}>
      <summary className="ui-collapsible__summary">
        <Label color="label" style={{flexShrink: 1}}>{label}</Label>
        <svg className="ui-collapsible__chevron" width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path d="M1.5 1.5 L6.5 7 L1.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </summary>
      <div className="ui-collapsible__content">{children}</div>
    </details>
  );
}
