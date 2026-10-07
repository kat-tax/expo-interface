/** The narrowest a cell goes before the grid gives up a column. */
export const MIN_ITEM_WIDTH = 150;

/** The most columns a grid takes without being told. */
export const MAX_COLUMNS = 4;

/** The space between cells. */
export const GAP = 12;

/** What a cell is tall before the platform has measured it. */
export const ESTIMATED_CELL = 180;

/**
 * How many columns a width holds: as many cells of at least `minItemWidth`
 * as fit with `gap` between them, at least one and at most `maxColumns`.
 * A width of nothing (not measured yet) holds one.
 */
export function columnsFor(width: number, minItemWidth: number, maxColumns: number, gap: number): number {
  if (width <= 0) return 1;
  const fit = Math.floor((width + gap) / (minItemWidth + gap));
  return Math.max(1, Math.min(maxColumns, fit));
}

/** The cells of `data` cut into rows of `columns`, for a list that draws a row at a time. */
export function rowsOf<T>(data: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let at = 0; at < data.length; at += columns) rows.push(data.slice(at, at + columns));
  return rows;
}
