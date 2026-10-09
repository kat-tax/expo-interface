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
`color`, `tone`, `iconSize`, `hideLabel`, `disabled` and `pressed` (the
trigger is a toggle that is on: drawn filled in the accent, whatever the
variant, and heard as `Button pressed` is on each platform, for a tool
whose menu picks what it does; it opens the menu either way).

A `MenuItem` has `label`, `icon`, `swatch` (a color dot in place of the
icon), `active` (a check mark), `role` (`default`, `destructive`),
`disabled`, `keywords` (never drawn; read by `PopupMenu`'s filter),
`separator` (a rule above the item), `shortcut` (`Ctrl+S`, `F2`) and
`onPress`. `Menu`, `ContextMenu`, `PopupMenu` and `Fab` share it. A close a
menu reports comes after the item's `onPress`.

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
  the menu draws monochrome. iOS's `PopupMenu`, whose rows the kit draws,
  draws the dot as a symbol in its color. A `HeaderMenu` in a native stack
  header (on iOS, and on Android when its icon has an Android drawable)
  draws no dot, since its entries are Expo Router `Stack.Toolbar` menu
  actions, which the kit gives no swatch.
- `shortcut` is drawn beside the label and bound wherever the focus is while
  the menu is mounted on Windows, as WinUI draws an accelerator. The other
  platforms ignore it.
- `trigger: 'link'` is a text link on web and the text variant on Windows.
- On web the trigger takes its popover target once the page has hydrated,
  so on a static page a press before then does nothing, rather than opening
  a list with no anchor and entries that do nothing yet.
- On web Escape closes an open menu wherever the focus is, and the key goes
  no further: a web `Sheet` or a `Popover` card the menu is in stays up, and
  takes the next one.
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
- On web Escape closes the open menu and goes no further, as for `Menu`.
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
was picked), which arrives after the entry's `onPress`, or `dismiss` (a press
outside, Escape, the back gesture). A close
the app asked for by clearing `at` is not reported. While the menu is open,
a new `at` moves it: a menu moved from one handle to the next stays open,
and no late close of the first reaches the second. On web that holds for a
move made by a press outside the menu too, as a context menu raised by the
next handle's right button is: the menu is closed while the press is held
and shown at the new place once it is over. A web menu raised while a
pointer button is down opens the same way, once the press is over, in the
task after its release: the browser settles what a press light-dismisses as
the button goes down and carries it out at the release, so a popover shown
before that task, even from the release's own listeners, is dismissed with
that same press. On iOS, Android and Windows a press outside the open menu
is the platform's dismissal, reported as `dismiss`. On web, Escape closes the
menu wherever the focus is, even in an editor that keeps the key for itself,
and the key goes no further, so a web `Sheet` or a `Popover` card the menu
is in stays up.

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
`bottom`), `width` (280), `modal`, `label`, `insets` (`top`, `bottom`, `left`,
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

Each time the card comes up, it is drawn only once it has been measured, so
where it shows is worked out from its own height: a card that goes above the
rectangle is not seen below it first. On iOS, Android and Windows the
platform's toolkit sizes the action buttons after the card's first layout,
so the card waits for them too; on web, where the browser can report the
card's size just before its parent's, it waits for the parent's report that
follows, and no longer, so a parent the browser does not report, one with no
size, does not keep it hidden. Until then it is invisible and takes no
presses. A card that stays up while it moves to another
rectangle, or while what it holds changes, is placed by the height it has
until it is laid out again, and so is one whose `children` hold content the
toolkit sizes later.

A test renderer lays nothing out, so in an app's tests the card stays
invisible and takes no presses until the test reports its layout. With React
Native Testing Library, fire `layout` with a height on the card (`testID`),
then on its row of actions (`<testID>-actions`) when it has actions. Under
jsdom, stub `ResizeObserver`, through which react-native-web reports a
layout, call its callback with the card and its parent (`<testID>-bounds`),
and let the timeout react-native-web measures in run.

The card's content is not under a screen's bar: `useScrollInsets()` answers
zero inside it on every platform, as it does in a `Sheet`, so a `List`,
`CardGrid` or `FieldGroup` in it pads only by its own insets.

`onDismiss` says why the card asks to close: `action` (one of its actions
was taken), `backdrop` (the backdrop of a modal card was pressed, or on
Windows a click landed outside the tip), `escape` (Escape on web, wherever
the focus is, or VoiceOver's escape gesture on a modal card) or `leave` (a
hover card's pointer stayed away for its grace). On web the card takes Escape
before an editor that keeps the key for itself, and the key goes no further:
neither the focused editor nor an overlay the card is in, such as a web
`Sheet`, acts on it too. One Escape closes one overlay: a card with a menu
open in it, or another card up inside it, leaves the key to that one and
takes the next. A menu open beside the card takes it before the card,
since the browser draws the menu over it; of two cards up side by side,
the one that came up last takes it. A card with no `onDismiss` leaves
Escape alone, unless it is lingering, which Escape ends.

A `modal` card takes the presses around it as its backdrop, so nothing under
it is pressed by mistake, and says it is a dialog: VoiceOver keeps its focus
inside, and a browser announces a modal dialog named by `label`, or by the
title without one. On Windows the card is a group of that name, since
react-native-windows composes no name from the text in a view and cannot mark
one as a dialog. iOS and Android read what the card holds. The backdrop is a
Dismiss button to the screen readers that reach it.

A `hover` card is about what is under the pointer. The app sets `at` while
the pointer is over the thing and clears it when the pointer leaves; the
card lingers on the last rectangle for `grace`, and stays while the pointer
is over it, so the pointer can cross onto it. Once the pointer has been away
from both for the grace, the card goes and reports `leave`. A touch is not a
hover, so a finger on the card neither keeps it nor counts as leaving.

An action, the backdrop or Escape ends the linger: the card goes when the app
clears `at`, with no `leave` after it, and a card that goes from under the
pointer does not keep the next one up. While it lingers the card draws the
`title`, `message`, `actions` and `children` the app passes then, so an app
clears only `at` when the pointer leaves and keeps the rest until `onDismiss`
reports the card gone.

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
(`label`, `role` `default`, `cancel` or `destructive`, `onPress`,
`disabled`; defaults to one OK), `input` (a text field for the one-field prompts, a name for a
new thing or a rename: `placeholder`, `value`, `onChangeText`,
`secureTextEntry`, `keyboardType`, `autoCapitalize`, `autoCorrect`,
default true, `autoFocus`, default true, `testID`), `sheet`, `children` (an optional trigger rendered in place),
`testID`. It mounts its own host where there is none, so it can be rendered
anywhere.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Alert`, or `ConfirmationDialog` with `sheet`. The field is a SwiftUI `TextField` among the alert's actions, which is where SwiftUI takes one. |
| Android | Material 3 `AlertDialog`, with the actions in a column for `sheet`. The field is Material's outlined field under the message, the way Android's own dialogs draw an input, with the kit's placeholder colour and cursor tint. |
| Web | A real `<dialog>` opened with `showModal()`: the top layer, a backdrop, a focus trap and Escape. `sheet` anchors it to the bottom. The field is a box under the message. |
| Windows | A dialog in `ContentDialog`'s arrangement, smoke over the whole window and the card with the title, message and actions, drawn in a windowed popup, since a `ContentDialog` can only cover its own island. Up to three actions take the dialog's own buttons; more are stacked in the body. The field is a WinUI `TextBox` in the dialog's body, placed there through a portal. |

On web Escape closes the alert alone: the key goes no further, so a web
`Sheet` the alert opened from stays up.

`sheet` has no Windows form; a dialog is drawn either way, and an action
sheet holds no field on any platform. The field is controlled through
`value` and `onChangeText`, so the action that reads it has it, and an
action that waits for a value is `disabled` until it has one: greyed out,
it takes no press. A disabled action does not hold the alert open: on
Android the back gesture and a press outside it, on web Escape and a press
on the backdrop, and on Windows Escape still dismiss it and report
`onDismiss`, even with the cancel action disabled. An iOS alert (not a
`sheet`, which a press outside also closes) closes only through its
actions, so keep its cancel action enabled. On web and
Windows the keyboard's action key presses the first action that is not
`cancel`, and nothing while that action is disabled. On Windows a change
to the actions while the dialog is open updates each button's label and
whether it takes presses; the buttons are arranged as it opens.

`onDismiss` fires when the alert closes after an action or when the user
dismisses it. Clearing `visible` closes the alert without a report, on
every platform.

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
most the body alone grows to: in points, or a fraction of the window's
height, `{fraction: 0.6}`), `testID`.

The bar is drawn as soon as a title or any of its buttons is given. Without
`snapPoints` the sheet fits its content on every platform; `maxHeight` caps
that, and the body then scrolls inside the cap as React Native content the
width of the sheet. A fraction is kept between 0 and 1. On web it is of the
viewport's dynamic height, which follows a phone browser's toolbar, and on
Windows of the area the sheet's layer covers, which is the window under the
kit's `Stack`. On an iPad the sheet is a form sheet, shorter than the
window, while the fraction is still of the window's height, so a fraction
there leaves less of the sheet for the rest than on a phone. The cap is the
body's alone: the bar, the accessory, the footer, the actions and the
sheet's padding come on top, so leave room for them with a fraction well
under 1. With a fraction near 1 the sheet is taller than the platform lets
it be: on iOS and Android the footer and the actions are pushed out of it,
and on web the drawer, which stops short of the viewport's top, scrolls as
a whole around the body's own scrolling. On Windows the card stops short of
the window and the body gives way inside it.

```tsx
<Sheet isPresented={open} onDismiss={close} title="History" maxHeight={{fraction: 0.6}}>
  <Versions/>
</Sheet>
```

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI's sheet, with a real material through `presentationBackground`. The bar, the accessory and the actions are SwiftUI content: the title in the headline font, the kit's buttons at the ends. The pieces stack in one SwiftUI column with no spacing, so the sheet's padding is paid once and a sheet without `snapPoints` fits all of them. |
| Android | Compose's `ModalBottomSheet`, presented by the kit in a host of its own. A sheet without `snapPoints` opens whole: Material offers a sheet taller than half the window a stop half way up, where the footer and the actions would sit below the screen's edge, and the sheet skips it. It takes a container color and nothing else, so the sheet is opaque. The bar, the accessory and the actions are Compose content: Compose has no app bar in `@expo/ui`, so the bar is a row in the sheet's palette with the kit's buttons at the ends. A capped body hands a drag to the sheet, which expands before the body scrolls and collapses when the body is dragged down from its top, as a list in a Material sheet does. |
| Web | `@expo/ui`'s drawer, drawn on the material as the kit's bars are: the raised fill thinned over a blur of what passes under it, with a hairline and a soft shadow along its top edge, by the stylesheet the tab bar and the screen header use. The bar is the kit's, in the `ScreenHeader` look, with the title a level 2 heading, the level of the drawer's own hidden title. As the sheet opens the keyboard focus moves to the title, or to the first control in a sheet without one, since the drawer leaves it on the control that opened the sheet, which its dialog then hides from assistive technology; once the sheet has gone the focus returns to that control. A capped body takes keyboard focus, so the arrow keys scroll it. |
| Windows | A layer drawn in React Native: WinUI's smoke and a centered card, the content scrolling inside, covering the whole window under the kit's `Stack` and the nearest ancestor elsewhere. A sheet's content is React Native's, which no XAML flyout or dialog can hold, and React Native's `Modal` cannot hold a XAML island on react-native-windows 0.84. No material. The bar, the accessory, the footer and the actions stay put while the body scrolls. |

On iOS and Android the bar, the accessory and a body without `maxHeight`
are the sheet's native content, where the kit's controls render bare. Such
a body must be `@expo/ui` content (a `FieldGroup`, a `List`, a
`ColorPicker`), as a `Collapsible`'s children must be. A capped body and the
footer are React Native content, each hosted in the sheet in an
`RNHostView` at the sheet's width, since a React Native view inside the
platform's sheet takes no presses and has no width of its own to fill
without one. The sheet's pieces sit in one native column that takes the
width the sheet offers and reports it, so the hosted pieces span a sheet
that fills a phone in landscape, stay inside its safe areas and inside an
inset sheet, and follow a rotation. Until the column has reported, they
take the window's width, at most a form sheet's on an iPad or 640 points on
Android (Material's limit for a sheet), less the sheet's padding. A
`Pressable` in them takes presses, and a control in them mounts a host of
its own. `@expo/ui` content of the app's own draws nothing in them without
a host: wrap it in a `NativeHost`. Give a React Native body a `maxHeight`.
Give a `List`, or a `FieldGroup` taller than the room, one too: a native
body takes all the room the sheet offers and leaves the footer and the
actions none. With `maxHeight` the body is hosted, and a `List` in it is
the cap tall and scrolls inside it; on Android a drag on that list scrolls
the list alone, where a drag on the rest of a capped body also moves the
sheet.

On web and Windows the sheet's content counts as hosted: controls inside it
render bare, and a React Native box inside it (a `Composer`) mounts a
`NativeHost` for the controls it holds, as the kit's own do.

The sheet's content is not under a screen's bar: `useScrollInsets()`
answers zero inside it on every platform, so a `FieldGroup`, `List` or
`CardGrid` there pads only by its own insets, whatever screen the sheet
opens from.

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
until its action is taken, at the foot of its area, above the bottom safe
area (the home indicator, Android's navigation bar). On iOS and Android it
also stands above the tab bar of a `Tabs` under it, and above the bar's
bottom accessory on iOS 26. It comes down to the safe area while the tabs
are hidden and while a stack around them shows a screen over them. The bar
is counted at the platform's standard height (`inset.bottomTab`), not
measured, so where the platform draws it shorter or not at the bottom
(iPadOS 18 and later draw it at the top of a regular-width window) the toast
stands higher than the bar needs, as the tabs' floating action does. `show`
answers an id; `dismiss(id)` takes that toast away, showing or waiting, and
`dismiss()` the one showing. A `Screen` under the provider lifts its `Fab`
above the app's toast as it does above its own, by the larger of the two,
and the tabs' floating action lifts above it too. A provider inside one
tab's layout shows its toasts in that tab, above the bar, but the tabs'
floating action lifts only above the toast of a provider around them.
