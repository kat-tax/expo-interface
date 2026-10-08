# Accessibility

[Docs home](README.md)

Every control has an accessible name on every platform. Past the name, each
platform gets what it can carry:

| Platform | What the kit sets |
| --- | --- |
| iOS | Labels, hints, values and traits on the SwiftUI controls; the heading trait on titles; `Tooltip` as a hint |
| Android | The Compose controls' own semantics; `contentDescription` on icons; the heading role on titles. `@expo/ui`'s Compose layer exposes no modifier for a content description, so a name goes in as unseen text that a pressable merges: a `Badge` inside a host reads its number and then the rest of its label, a free-standing one is drawn and announces its label, and a `ColorPicker` swatch carries its name that way, while TalkBack passes over the swatches of a disabled picker. A [`ListItem`](components/layout.md#listitem) is read from its own texts rather than a name composed from its slots, for the same reason, and `selected` is announced only on a row that presses by itself (Compose's `selectable`), not an inert one or one with `swipeActions`. |
| Web | Real elements with their native semantics, ARIA roles where the kit composes (`menu`, `radiogroup`, `tablist`, `dialog`, `tooltip`, `status`, `meter`, `heading` with a level, `navigation`), and the keyboard patterns those roles promise |
| Windows | The islands carry WinUI's own UI Automation. For what the kit draws: the name, `AutomationId` from `testID`, the heading role, `HelpText` from `accessibilityHint`, and the position in a set through `inSet` on the tab view's drawn tabs. `IsDialog` and `LandmarkType` cannot be set from JavaScript on react-native-windows. |

Three rules the kit follows:

- An element referenced by `aria-labelledby` is read whole, `aria-hidden`
  descendants included, so the reference points at a title span and never at
  a container that also holds an icon ligature.
- A tab cannot carry a second announced control on web, so the close cross
  is a pointer affordance and Delete is the keyboard's close, announced by
  `aria-keyshortcuts`.
- A drawn control on Windows gets an explicit label: react-native-windows
  composes no name from the text inside a view.

Every story runs axe at the error level, and the harness reads the
accessibility tree on web, Windows and Android, which is where names that
tests and axe cannot see are checked.
