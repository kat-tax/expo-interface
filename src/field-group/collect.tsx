import type {ReactElement, ReactNode} from 'react';
import {Children, Fragment, createContext, isValidElement, useCallback, useContext, useLayoutEffect, useState} from 'react';
import {flushRow} from './rows';

/** The key of the group's child a section is rendered under. */
const ChildKeyContext = createContext<string | null>(null);

/** Whether the group knows that child is a section already, by its type. */
const KnownContext = createContext(false);

/** Where a section the group could not see reports itself; the returned function takes the report back. */
const ReportContext = createContext<((key: string) => () => void) | null>(null);

/**
 * Called by a kit `Section`: tells the group that the child it is rendered
 * under is a section, when the group could not tell from the child's type
 * (a component of the app's own that renders the section).
 */
export function useReportSection(): void {
  const key = useContext(ChildKeyContext);
  const known = useContext(KnownContext);
  const report = useContext(ReportContext);
  useLayoutEffect(() => (key != null && !known && report ? report(key) : undefined), [key, known, report]);
}

/** The element children with fragments walked, each with a key unique in the group. Bare text has no row to be. */
function flatten(children: ReactNode, prefix = ''): {key: string; child: ReactElement}[] {
  return Children.toArray(children).filter(isValidElement).flatMap(child => {
    const key = `${prefix}${String(child.key)}`;
    if (child.type === Fragment) return flatten((child.props as {children?: ReactNode}).children, `${key}/`);
    return [{key, child}];
  });
}

interface SectionGroupsProps {
  children: ReactNode;
  /** Whether a child is a section by its type. */
  isSection: (child: ReactElement) => boolean;
  /** The implicit section that holds a run of loose rows. */
  implicit: (rows: ReactNode[], key: string) => ReactNode;
}

/**
 * A group's children as a SwiftUI `Form` takes them: consecutive rows in an
 * implicit section, sections as they are. A kit `Section` is known by its
 * type, directly or in a fragment. One inside a component of the app's own
 * reports itself through context, and the child it is under is a section
 * from then on, so a form can be split into components. A layout effect
 * reports it, so the group is laid out again before anything is drawn.
 */
export function SectionGroups({children, isSection, implicit}: SectionGroupsProps) {
  const [reported, setReported] = useState<ReadonlyMap<string, number>>(() => new Map());
  const report = useCallback((key: string) => {
    setReported(previous => new Map(previous).set(key, (previous.get(key) ?? 0) + 1));
    return () => setReported(previous => {
      const next = new Map(previous);
      // A report is always taken back after it was made, so its key is there.
      const count = next.get(key)! - 1;
      if (count > 0) next.set(key, count);
      else next.delete(key);
      return next;
    });
  }, []);
  const result: ReactNode[] = [];
  let rows: ReactNode[] = [];
  const flush = () => {
    if (rows.length === 0) return;
    result.push(implicit(rows, `__implicit-section-${result.length}__`));
    rows = [];
  };
  for (const {key, child} of flatten(children)) {
    const known = isSection(child);
    const node = (
      <ChildKeyContext.Provider key={key} value={key}>
        <KnownContext.Provider value={known}>{known ? child : flushRow(child)}</KnownContext.Provider>
      </ChildKeyContext.Provider>
    );
    if (known || reported.has(key)) {
      flush();
      result.push(node);
    } else {
      rows.push(node);
    }
  }
  flush();
  return <ReportContext.Provider value={report}>{result}</ReportContext.Provider>;
}
