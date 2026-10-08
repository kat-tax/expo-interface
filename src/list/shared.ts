import type {ListProps} from './types';

/** What a row is tall before the platform has measured it. */
export const ESTIMATED_ROW = 56;

/** Whether the list shows its `empty` content in place of the rows: no rows, and something to show. */
export function showsEmpty<T>({data, empty}: Pick<ListProps<T>, 'data' | 'empty'>): boolean {
  return data.length === 0 && Boolean(empty);
}

/** The key a row is drawn under: the app's, or its index. */
export function keyOf<T>(props: Pick<ListProps<T>, 'keyExtractor'>, item: T, index: number): string {
  return props.keyExtractor ? props.keyExtractor(item, index) : String(index);
}
