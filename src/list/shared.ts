import type {ListProps} from './types';

/** What a row is tall before the platform has measured it. */
export const ESTIMATED_ROW = 56;

/** The key a row is drawn under: the app's, or its index. */
export function keyOf<T>(props: Pick<ListProps<T>, 'keyExtractor'>, item: T, index: number): string {
  return props.keyExtractor ? props.keyExtractor(item, index) : String(index);
}
