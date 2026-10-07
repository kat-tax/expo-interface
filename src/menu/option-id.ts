/** The DOM id of a menu entry in a list the focus stays out of, for a field's `aria-activedescendant`. */
export function optionId(list: string, index: number): string {
  return `${list}-option-${index}`;
}
