# Accessibility

[Docs home](README.md)

Every control has an accessible name on every platform. Past the name, each
platform gets what it can carry:

| Platform | What the kit sets |
| --- | --- |
| iOS | Labels, hints, values and traits on the SwiftUI controls; the heading trait on titles; `Tooltip` as a hint |
| Android | The Compose controls' own semantics; `contentDescription` on icons; the heading role on titles. A control whose label is drawn beside it carries the label as its content description: a `Switch`, a `Checkbox`, a `Slider` and a password `TextField` that holds text. Compose reports a node's role only where the node has no semantic children, so a labelled `Switch` and `Checkbox` and the `Picker` are a node with none laid over their row, which holds the role, the name, the state, the press and the `testID`, disabled or not; Compose leaves out of the tree what that node covers, and draws the texts still to be read over it. A text field always has a semantic child, and Compose hands its description to a child of its own, as it does a label or a placeholder, which TalkBack reads with the field. A content description stands in for a node's own text, and a row that merges what it holds reads every description before its texts, so where a name joins text that TalkBack already reads it goes in as unseen text that a pressable merges: a `Badge` inside a host reads its number and then the rest of its label, a free-standing one is drawn and announces its label, and a `ColorPicker` swatch carries its name that way, while TalkBack passes over the swatches of a disabled picker. A [`ListItem`](components/layout.md#listitem) is read from its own texts rather than a name composed from its slots, for the same reason, and `selected` is announced only on a row that presses by itself (Compose's `selectable`), not an inert one or one with `swipeActions`. A plain `row` `TextField` is named by its placeholder only while it is empty: a description would replace its text when TalkBack reads it by character or word. |
| Web | Real elements with their native semantics, ARIA roles where the kit composes (`menu`, `radiogroup`, `tablist`, `dialog`, `tooltip`, `status`, `meter`, `heading` with a level, `navigation`), and the keyboard patterns those roles promise |
| Windows | The islands carry WinUI's own UI Automation. For what the kit draws: the name, `AutomationId` from `testID`, the heading role, `HelpText` from `accessibilityHint`, and the position in a set through `inSet` on the tab view's drawn tabs. `IsDialog` and `LandmarkType` cannot be set from JavaScript on react-native-windows. |

Five rules the kit follows:

- An element referenced by `aria-labelledby` is read whole, `aria-hidden`
  descendants included, so the reference points at a title span and never at
  a container that also holds an icon ligature.
- A tab cannot carry a second announced control on web, so the close cross
  is a pointer affordance and Delete is the keyboard's close, announced by
  `aria-keyshortcuts`.
- A drawn control on Windows gets an explicit label: react-native-windows
  composes no name from the text inside a view.
- A badge its parent speaks for (`Badge` with `label={null}`, and whatever a
  `TabView` tab holds as its `accessory`) is no accessibility element of its
  own, so a screen reader stops on the parent once; on Android an accessible
  view inside another is a stop of its own, and inside a host there the
  badge's number stays a text TalkBack reads, since `@expo/ui` has no
  modifier that clears a node's semantics.
- A `Sheet` on the web moves the keyboard focus into itself as it opens, to
  its title or else to its first control, and gives it back to the control
  that opened it once the sheet has gone: the drawer leaves the focus where
  it was while its dialog hides the rest of the page from assistive
  technology, so a screen reader would otherwise sit on a hidden button.

Every story runs axe at the error level, and the harness reads the
accessibility tree on web, Windows and Android, which is where names that
tests and axe cannot see are checked.
