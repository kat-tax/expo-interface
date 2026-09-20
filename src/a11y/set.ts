/**
 * Where an item sits in a set of them — "3 of 7" — for a set the kit draws
 * itself rather than handing to a platform control.
 *
 * Empty everywhere but Windows, and that is not an oversight. A platform
 * control works this out on its own (a WinUI `TabView` numbers its own tabs,
 * a `SelectorBar` its own items), so this is only for the few places the kit
 * draws the set. Of the other three: React Native exposes no prop for it on
 * iOS, where VoiceOver derives the position from the accessibility container;
 * Android's `collectionItemInfo` has no React Native prop either; and on web
 * the kit writes real DOM, where a `tablist` of `tab`s already carries the
 * count.
 *
 * @see set.windows.ts, which returns the props react-native-windows answers
 * `UIA_PositionInSetPropertyId` and `UIA_SizeOfSetPropertyId` from.
 */
export function inSet(_position: number, _size: number): object {
  return {};
}
