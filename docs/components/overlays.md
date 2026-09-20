# Overlays

[Docs home](../README.md)

Menus, popovers, tooltips, dialogs, sheets and toasts.

Everything is exported from `expo-interface`. Each entry says what the component
does, which props it takes, what each platform renders, and where the platforms
differ. [All components](README.md) lists the other groups.

## Menu

A dropdown menu of actions opened from a button. Props: `label`, `icon`,
`items`, `trigger` (`button`, or `link` for a text link in a bar),
`onOpenChange`, `testID`, and the `Button` props `variant`, `size`, `shape`,
`color`, `tone`, `iconSize`, `hideLabel`, `disabled`.

A `MenuItem` has `label`, `icon`, `swatch` (a color dot in place of the
icon), `active` (a check mark), `role` (`default`, `destructive`),
`disabled`, `keywords` (never drawn; read by `PopupMenu`'s filter),
`separator` (a rule above the item), `shortcut` (`Ctrl+S`, `F2`) and
`onPress`. `Menu`, `ContextMenu`, `PopupMenu` and `Fab` share it.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Menu`, with a checked `Toggle` for an active item |
| Android | Material 3 `DropdownMenu` |
| Web | A `role="menu"` popover placed by CSS anchor positioning below the trigger, flipping when there is no room, with one tab stop, arrow keys, Home, End and typeahead |
| Windows | WinUI `MenuFlyout` below the trigger |

Differences:

- `onOpenChange` is reported on Android, web and Windows. SwiftUI's `Menu`
  has no presentation binding, so iOS never reports it.
- `swatch` is drawn on Android, web and Windows. iOS menus render images
  monochrome, so the dot is not shown there.
- `shortcut` is drawn beside the label and bound wherever the focus is while
  the menu is mounted on Windows, as WinUI draws an accelerator. The other
  platforms ignore it.
- `trigger: 'link'` is a text link on web and the text variant on Windows.

## ContextMenu

A menu of actions opened by long-pressing or right-clicking its content, or
at a point the content reports. Props: `items`, `children` (must be `@expo/ui`
content on iOS and Android), `onPress` (the content's own press), `trigger`
(`longPress`, the default, or `tap`), `disabled`, `at` (a point relative to
the content's top left, or `null`), `onDismiss`, `onOpenChange`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `contextMenu` on a long press, or a SwiftUI `Menu` with the content as its label for `tap` |
| Android | Material 3 `DropdownMenu` from `combinedClickable`'s long click, or its click for `tap` |
| Web | The same menu popover as `Menu`, opened at the pointer by `contextmenu` or a 500 ms touch press, or by a click for `tap` |
| Windows | WinUI `MenuFlyout` at the pointer, from the right mouse button, a long press, the Menu key or Shift+F10, or a press for `tap` |

Differences:

- `at` opens the menu at a point on Android, web and Windows. SwiftUI has no
  menu at a point, so iOS ignores it and does not report `onDismiss`.
- A right click and the Menu key open the menu on web and Windows whichever
  `trigger` says; they are what the platform and its screen readers reach for.
- `onOpenChange` is not reported on iOS.
- There is no `doubleTap` trigger: `@expo/ui` exposes no double click from
  Compose, and SwiftUI has no way to open a context menu programmatically.

## PopupMenu

The platform's menu opened at a point over content the kit did not draw: a
canvas, a web view, an editor. It wraps nothing. Props: `items`, `at` (a
point, or `null` to close), `filter` (matches the label or `keywords`, for a
menu typed into), `onDismiss`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | A SwiftUI `Popover` with the rows drawn by hand, since SwiftUI opens a `Menu` only from its own button |
| Android | Material 3 `DropdownMenu` from a one-point host |
| Web | The same menu popover, anchored at the point |
| Windows | WinUI `MenuFlyout` at the point |

On web the matched part of a label is marked with the CSS Custom Highlight
API, which adds nothing to the DOM and leaves the accessible name as it was.
The other platforms take plain label strings and show the match unmarked.

`caretPoint(field, within)` measures where the caret is in a text field, so
a `PopupMenu` can open under it for a slash command. It is web only: React
Native's `TextInput` reports selection as offsets and no rectangle, and a
caret point on the other platforms would take a native module each. There it
answers `null`, and a caller anchors the menu under the field instead.

## Popover

A card pointing at a rectangle on a canvas: a spelling suggestion, a note on
a block, a warning about a link. Props: `at` (`{x, y, width, height}` or
`null`), `title`, `message`, `actions` (`label`, `onPress`, `role`),
`onDismiss`, `preferredEdge` (`auto`, `top`, `bottom`), `width` (280),
`children`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` card placed below the rectangle and flipped above when there is no room, with native buttons for the actions |
| Windows | A WinUI `TeachingTip` with a tail that points at its target. A popover with `children` is drawn as on the other platforms, since its content is React Native's. |

`preferredEdge` offers the two vertical edges only, since the drawn card
cannot reach a side, and it is a preference: with no room on the edge asked
for, the card goes to the other.

## Tooltip

A short hint attached to a piece of content. Props: `text`, `children` (must
be `@expo/ui` content on Android, and non-interactive everywhere, since the
web trigger is a button), `testID`.

| Platform | Renders |
| --- | --- |
| iOS | Nothing visible. iOS has no tooltip idiom (`help()` is macOS and visionOS only), so the text becomes an accessibility hint on the content. |
| Android | Material 3 `PlainTooltip` on a long press |
| Web | A `role="tooltip"` popover on hover and focus through the Interest Invoker API (`interestfor`), with the `title` attribute where the browser lacks it |
| Windows | react-native-windows' own tooltip on hover and keyboard focus |

On Windows the tooltip is a pointer and focus affordance only. The wrapper is
not what takes the focus, and react-native-windows composes no help text from
an ancestor, so Narrator does not read it. An app that needs the text
announced sets `accessibilityHint` on the control itself.

## Alert

A modal dialog, or an action sheet, with a title, a message and actions.
Props: `title`, `message`, `visible`, `onDismiss`, `actions` (`label`,
`role` `default`, `cancel` or `destructive`, `onPress`; defaults to one OK),
`sheet`, `children` (an optional trigger rendered in place), `testID`. It
mounts its own host where there is none, so it can be rendered anywhere.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Alert`, or `ConfirmationDialog` with `sheet` |
| Android | Material 3 `AlertDialog`, with the actions in a column for `sheet` |
| Web | A real `<dialog>` opened with `showModal()`: the top layer, a backdrop, a focus trap and Escape. `sheet` anchors it to the bottom. |
| Windows | A dialog in `ContentDialog`'s arrangement, smoke over the whole window and the card with the title, message and actions, drawn in a windowed popup, since a `ContentDialog` can only cover its own island. Up to three actions take the dialog's own buttons; more are stacked in the body. |

`sheet` has no Windows form; a dialog is drawn either way.

## Sheet

A bottom sheet that inherits the accent, over `@expo/ui`'s `BottomSheet`
props plus `material` (`none`, `thin`, `regular`, `thick`).

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI's sheet, with a real material through `presentationBackground` |
| Android | Compose's `ModalBottomSheet`. It takes a container color and nothing else, so the sheet is opaque. |
| Web | `@expo/ui`'s drawer with `backdrop-filter` for the material |
| Windows | A layer drawn in React Native: WinUI's smoke and a centered card, the content scrolling inside, covering the whole window under the kit's `Stack` and the nearest ancestor elsewhere. A sheet's content is React Native's, which no XAML flyout or dialog can hold, and React Native's `Modal` cannot hold a XAML island on react-native-windows 0.84. No material. |

The sheet's content counts as hosted: controls inside it render bare.

## Toast

A brief message over the screen. Props: `message`, `visible`, `action`
(`label`, `onPress`), `onDismiss`, `duration` (4000 ms), `testID`.

A duration of zero or less keeps the toast up until its action is taken or it
is dismissed, which is what Material calls an indefinite snackbar.

| Platform | Renders |
| --- | --- |
| iOS, Web | A drawn capsule, the one Apple's apps draw, timed by the kit |
| Android | Material 3 `Snackbar`, which owns its timing, animation and queue and rounds the duration to the platform's short, long or indefinite |
| Windows | WinUI `InfoBar` over the bottom of the screen, with a close button, timed by the kit |

The drawn toast is a polite live region.
