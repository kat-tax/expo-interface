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
- `swatch` is a color dot on Android, web and Windows. On iOS it is an
  image the kit writes once per color into the app's cache through
  `expo-file-system`, since a `UIMenu` draws a symbol in the menu's tint
  but keeps an image's colors; without the module the dot is a symbol, which
  the menu draws monochrome.
- `shortcut` is drawn beside the label and bound wherever the focus is while
  the menu is mounted on Windows, as WinUI draws an accelerator. The other
  platforms ignore it.
- `trigger: 'link'` is a text link on web and the text variant on Windows.
- On iOS and Android a menu outside a host mounts one of its own, sized to
  its trigger, so it can be placed in a React Native layout like any
  element. See [Native hosts](../hosts.md).

## ContextMenu

A menu of actions opened by long-pressing or right-clicking its content, or
at a point the content reports. Props: `items`, `children` (must be `@expo/ui`
content on iOS and Android), `onPress` (the content's own press), `label`
(the name that press is announced by on Windows, where the pressable around
the content is what a screen reader lands on; iOS and Android name the
content itself), `trigger` (`longPress`, the default, or `tap`), `disabled`,
`at` (a point relative to the content's top left, or `null`), `onDismiss`,
`onOpenChange`, `testID`. Without a press of its own the Windows wrapper is
nothing to a screen reader or the Tab key: the content's controls are what
they land on.

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
point or a rectangle, or `null` to close), `preferredEdge` (`auto`, `top`,
`bottom`), `filter` (matches the label or `keywords`, for a menu typed
into), `onDismiss(reason)`, `takesFocus`, `highlighted` and `id` (web, for
a menu typed into), `testID`.

| Platform | Renders |
| --- | --- |
| iOS | A SwiftUI `Popover` with the rows drawn by hand, since SwiftUI opens a `Menu` only from its own button |
| Android | Material 3 `DropdownMenu` from a one-point host |
| Web | The same menu popover, anchored at the point |
| Windows | WinUI `MenuFlyout` at the point |

A rectangle (a handle, a chip, a selection) opens the menu beside it rather
than over it: under it, or over it when the top is asked for and there is
room. iOS opens the popover from the rectangle's edge with its arrow fixed to
that side; Android anchors a strip one point wide and the rectangle's height
at its leading edge, so Compose opens the menu under it or, with no room
there, over it, which is Compose's own choice whatever `preferredEdge` says;
web and Windows place the menu on the edge asked for and move it to stay on
screen.

`onDismiss` says why the menu closed of its own accord: `select` (an entry
was picked) or `dismiss` (a press outside, Escape, the back gesture). A close
the app asked for by clearing `at` is not reported. While the menu is open,
a new `at` moves it: a menu moved from one handle to the next stays open,
and no late close of the first reaches the second. On web, Escape closes the
menu wherever the focus is, even in an editor that keeps the key for itself,
and the key goes no further.

`takesFocus={false}` is for a menu typed into, a slash command in an editor.
On web the focus stays in the field, and the menu is a `listbox` whose
current entry is `highlighted`, which the field moves with its arrow keys:
give the menu an `id`, and the field `aria-controls={id}` and
`aria-activedescendant={popupOptionId(id, highlighted)}`. The native menus
take the focus as their platform does and ignore the three props.

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
a block, a warning about a link, the editor of an option. Props: `at`
(`{x, y, width, height}` or `null`), `title`, `message`, `actions` (`label`,
`onPress`, `role`), `onDismiss(reason)`, `preferredEdge` (`auto`, `top`,
`bottom`), `width` (280), `modal`, `insets` (`top`, `bottom`, `left`,
`right`), `trigger` (`manual` or `hover`), `grace` (300 ms), `children`,
`testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` card placed below the rectangle and flipped above when there is no room, with native buttons for the actions |
| Windows | A WinUI `TeachingTip` with a tail that points at its target. A popover with `children`, a `modal` one and a `hover` one are drawn as on the other platforms, since the tip holds no React Native content and has no modal or hover form. |

`preferredEdge` offers the two vertical edges only, since the drawn card
cannot reach a side, and it is a preference: with no room on the edge asked
for, the card goes to the other. `insets` are what the card keeps clear of at
its parent's edges, a header over the canvas or a bar under it.

`onDismiss` says why the card asks to close: `action` (one of its actions
was taken), `backdrop` (the backdrop of a modal card was pressed, or on
Windows a click landed outside the tip), `escape` (Escape on web, wherever
the focus is, or VoiceOver's escape gesture on a modal card) or `leave` (a
hover card's pointer stayed away for its grace).

A `modal` card takes the presses around it as its backdrop, so nothing under
it is pressed by mistake, and says it is a dialog: VoiceOver keeps its focus
inside, a browser announces a modal dialog named by the title. The backdrop
is a Dismiss button to the screen readers that reach it.

A `hover` card is about what is under the pointer. The app sets `at` while
the pointer is over the thing and clears it when the pointer leaves; the
card lingers on the last rectangle for `grace`, and stays while the pointer
is over it, so the pointer can cross onto it. Once the pointer has been away
from both for the grace, the card goes and reports `leave`. A touch is not a
hover, so a finger on the card neither keeps it nor counts as leaving.

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

A modal dialog, or an action sheet, with a title, a message, a field and
actions. Props: `title`, `message`, `visible`, `onDismiss`, `actions`
(`label`, `role` `default`, `cancel` or `destructive`, `onPress`; defaults
to one OK), `input` (a text field for the one-field prompts, a name for a
new thing or a rename: `placeholder`, `value`, `onChangeText`,
`secureTextEntry`, `keyboardType`, `autoCapitalize`, `autoFocus`, default
true, `testID`), `sheet`, `children` (an optional trigger rendered in place),
`testID`. It mounts its own host where there is none, so it can be rendered
anywhere.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Alert`, or `ConfirmationDialog` with `sheet`. The field is a SwiftUI `TextField` among the alert's actions, which is where SwiftUI takes one. |
| Android | Material 3 `AlertDialog`, with the actions in a column for `sheet`. The field is the kit's Compose field under the message. |
| Web | A real `<dialog>` opened with `showModal()`: the top layer, a backdrop, a focus trap and Escape. `sheet` anchors it to the bottom. The field is a box under the message. |
| Windows | A dialog in `ContentDialog`'s arrangement, smoke over the whole window and the card with the title, message and actions, drawn in a windowed popup, since a `ContentDialog` can only cover its own island. Up to three actions take the dialog's own buttons; more are stacked in the body. The field is a WinUI `TextBox` in the dialog's body, placed there through a portal. |

`sheet` has no Windows form; a dialog is drawn either way, and an action
sheet holds no field on any platform. The field is controlled through
`value` and `onChangeText`, so the action that reads it has it; on web and
Windows the keyboard's action key presses the first action that is not
`cancel`.

## Sheet

A bottom sheet that inherits the accent, over `@expo/ui`'s `BottomSheet`
props, with a title bar, a cap on its height and the rows a sheet ends in.

Props: `@expo/ui`'s (`isPresented`, `onDismiss`, `snapPoints`,
`showDragIndicator`, `contentPadding`, `containerColor` and the rest),
`material` (`none`, `thin`, `regular`, `thick`), `title` and `subtitle`
(the bar along the top), `onBack` (a back button at the bar's leading
edge), `onClose` (a close button at its trailing edge; the app dismisses the
sheet from it, as from `onDismiss`), `menu` (the sheet's own actions behind
an ellipsis in the bar, before the close button), `accessory` (a row under
the bar: a `SegmentedControl` that picks what the body shows), `footer`
(the row under the body: a `Composer`), `actions` (buttons along the bottom
edge, trailing-aligned, the last one filled and the rest outlined; `label`,
`onPress`, `role`, `variant`, `disabled`, `loading` each), `maxHeight` (the
most the body grows to), `testID`.

The bar is drawn as soon as a title or any of its buttons is given. Without
`snapPoints` the sheet fits its content on every platform; `maxHeight` caps
that, and the body then scrolls inside the cap as React Native content the
width of the sheet.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI's sheet, with a real material through `presentationBackground`. The bar, the accessory and the actions are SwiftUI content beside the React Native body: the title in the headline font, the kit's buttons at the ends. |
| Android | Compose's `ModalBottomSheet`. It takes a container color and nothing else, so the sheet is opaque. The bar, the accessory and the actions are Compose content: Compose has no app bar in `@expo/ui`, so the bar is a row in the sheet's palette with the kit's buttons at the ends. |
| Web | `@expo/ui`'s drawer with `backdrop-filter` for the material. The bar is the kit's, in the `ScreenHeader` look, with the title a level 2 heading, the level of the drawer's own hidden title. A capped body takes keyboard focus, so the arrow keys scroll it. |
| Windows | A layer drawn in React Native: WinUI's smoke and a centered card, the content scrolling inside, covering the whole window under the kit's `Stack` and the nearest ancestor elsewhere. A sheet's content is React Native's, which no XAML flyout or dialog can hold, and React Native's `Modal` cannot hold a XAML island on react-native-windows 0.84. No material. The bar, the accessory, the footer and the actions stay put while the body scrolls. |

The sheet's content counts as hosted: controls inside it render bare. A
React Native box inside the sheet (a footer, a `Composer`) mounts a
`NativeHost` for the controls it holds, as the kit's own do. On iOS and
Android a capped body is told the sheet's width, since a React Native view
inside the platform's sheet has no width of its own to fill: the window's,
or a form sheet's on an iPad, less the sheet's padding.

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

A toast under a `Screen` tells it how much of the bottom edge it covers, and
the screen's `Fab` lifts above it while it shows.

For toasts the app shows from anywhere ("Copied", "Moved to the bin"), put a
`ToastProvider` around the app's navigation and call `useToast().show()`:

```tsx
const toast = useToast();
toast.show('Copied');
toast.show({message: 'Moved to the bin', action: {label: 'Undo', onPress: restore}, duration: 6000});
```

The provider queues them and shows one at a time, each for its duration or
until its action is taken, at the foot of its area. `show` answers an id;
`dismiss(id)` takes that toast away, showing or waiting, and `dismiss()` the
one showing. A `Screen` under the provider lifts its `Fab` above the app's
toast as it does above its own, by the larger of the two.
