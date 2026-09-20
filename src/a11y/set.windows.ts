/**
 * Windows answers "3 of 7" from two view props react-native-windows reads and
 * React Native's own types do not declare — `accessibilityPosInSet` and
 * `accessibilitySetSize`, which its composition automation provider returns
 * for `UIA_PositionInSetPropertyId` and `UIA_SizeOfSetPropertyId`.
 *
 * Narrator says it out loud, and nothing in the test suite can see it: the
 * harness's UI Automation tree prints it as `(3 of 7)`, which is the only
 * place in this repository the difference shows.
 *
 * Positions are one-based, as UI Automation counts them.
 */
export function inSet(position: number, size: number): object {
  return {accessibilityPosInSet: position, accessibilitySetSize: size};
}
