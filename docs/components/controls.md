# Controls

[Docs home](../README.md)

Buttons and the value controls. A value control is controlled: `value` pairs
with `onValueChange`.

Everything is exported from `expo-interface`. Each entry says what the component
does, which props it takes, what each platform renders, and where the platforms
differ. [All components](README.md) lists the other groups.

## Button

Props: `label` (required, the accessible name even with `hideLabel`),
`onPress`, `variant` (`filled`, `outlined`, `text`), `role` (`default`,
`destructive`), `color`, `tone` (`accent`, `label`; filled and outlined
buttons ignore it), `size` (`inline`, `small`, `medium`, `large`), `shape`
(`rounded`, `pill`, `circle`; each platform's default when omitted),
`iconSize`, `prefixIcon`, `suffixIcon`, `hideLabel`, `disabled`, `pressed`
(the button is a toggle, on or off), `loading` (the platform's spinner in the
icon's place, and no presses until it is done; the label stays, so the
button keeps its width), `fillWidth`, `testID`. Web only: `popoverTarget`
and `popoverTargetAction`, so the browser manages a popover's open state,
`aria-expanded` and light dismiss without JavaScript.

A button with `pressed` is a toggle: a tool that stays down while it is on,
a mode in a bar. While on it is drawn filled in the accent, whatever the
variant, and assistive technology hears the state: `aria-pressed` on web,
the selected trait on iOS, and on Android Material's own toggle buttons
(`IconToggleButton` for an icon, `ToggleButton` with a label, a toggleable
row at the `inline` size), whose checked state TalkBack reads. On Windows the
island draws the on state, and the button is announced as a button; a
toggle that announces itself there is an `IconToggle` or a `Toolbar`
command, which the `CommandBar` makes an `AppBarToggleButton`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` in the bordered-prominent, bordered or plain style, with a `ProgressView` while loading |
| Android | Material 3 `Button`, `OutlinedButton` or `TextButton`, or the icon buttons when icon-only, with a `CircularProgressIndicator` in the content slot while loading. `size: 'inline'` is a clickable row, since Material's buttons keep a minimum height no modifier can shrink. |
| Web | A real `<button>`, `aria-busy` with the kit's ring while loading |
| Windows | WinUI `Button`: the accent style for `filled`, the standard one for `outlined`, transparent for `text`, with Segoe glyphs and a `ProgressRing` while loading |

On iOS and Android a button outside a host mounts one of its own, sized to
itself, so it can be placed in a React Native layout like any element. See
[Native hosts](../hosts.md).

Differences:

- `hideLabel` needs an icon the platform can draw: a drawable on Android, a
  Segoe glyph on Windows. Without one the label still reads.
- `suffixIcon` needs a drawable on Android and is dropped when the button is
  icon-only.

```tsx
<Button label="Save" onPress={save}/>
<Button label="Delete" variant="outlined" role="destructive" onPress={remove}/>
<Button label="Share" prefixIcon={icons.share} hideLabel variant="text" onPress={share}/>
```

## Fab

A floating action button: the screen's primary action, floating over its
content at the bottom trailing corner. `Screen`'s `fab` slot places it.

Props: `label` (the accessible name, and the text of an `extended` one),
`icon`, `onPress`, `items` (a `MenuItem` list; with items the button opens a
menu instead of pressing), `onOpenChange`, `size` (`small`, `regular`, `large`,
`extended`; 40, 56 and 96 point squares, and 56 tall and as wide as its label),
`shape` (`rounded`, `circle`), `disabled`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | The Material geometry drawn in SwiftUI: a circle or capsule filled with the tint, the icon in `onTint`, a soft shadow. iOS has no such control. |
| Android | The Material 3 `FloatingActionButton` family |
| Web | A DOM `<button>` with the same geometry |
| Windows | Drawn with the same geometry, since Fluent has no such control: filled with the accent, a Segoe glyph, WinUI's state fills, the focus ring, Enter and Space. With `items` a press opens a WinUI `MenuFlyout` above the button. |

`onOpenChange` is reported on Android, web and Windows. SwiftUI's `Menu` has
no presentation binding, so iOS never reports it. On web a button with
`items` takes its popover target once the page has hydrated, as the `Menu`'s
trigger does, so on a static page a press before then does nothing, and
Escape closes the open menu and goes no further, as for `Menu`.

While a `Toast` under the same `Screen` shows, the button moves up by the
toast's height and back down as it goes, as Material's scaffold moves its
button for a snackbar, so the message is never covered.

```tsx
<Screen fab={<Fab label="New drop" icon={icons.upload} onPress={create}/>}>
  ...
</Screen>
```

## Chip

A small rounded thing you press: a filter across the top of a list, a tag on
a row, a suggestion under a field. Props: `label`, `onPress` (called with
what the state would become), `selected`, `icon`, `disabled`, `testID`.

Giving `selected` at all makes the chip a filter that can be off; leaving it
out makes it an action. Every platform splits on that, into the control that
carries the state to a screen reader and the one that does not:

| Platform | Filter | Action |
| --- | --- | --- |
| iOS | SwiftUI `Toggle` in the button style | A capsule `Button` |
| Android | `FilterChip` | `AssistChip` with an icon, `SuggestionChip` without |
| Web | `<button aria-pressed>` | `<button>` |
| Windows | WinUI `ToggleButton` with a pill radius | The kit's outlined pill `Button` |

Material's input chip, the one with a remove cross, is not offered: no other
platform has a control for it.

## IconToggle

A round icon button with two states, the outline when off and the filled
glyph when on. Props: `label`, `icon`, `activeIcon` (defaults to `icon`),
`value`, `onValueChange`, `color`, `offColor`, `size` (24), `disabled`,
`offVisibility` (`visible`, or `hidden` for a toggle that is not drawn,
pressed or announced while it is off: what a `Card` reveals under the
pointer), `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` with the selected trait while on |
| Android | Material 3 `IconToggleButton` |
| Web | `<button aria-pressed>` |
| Windows | WinUI `ToggleButton` holding a `FontIcon`, with the two colors in place of the control's checked fill |

On Windows a token with no Segoe glyph renders nothing. On iOS and Android
a toggle outside a host mounts one of its own, sized to itself. A hidden
toggle keeps its box on iOS (SwiftUI's `hidden`), web (`visibility: hidden`)
and Windows (`Visibility.Collapsed`, in a slot of its own), and gives it up
on Android, where Compose has nothing that hides a control from TalkBack
short of leaving it out.

## Switch

An on/off toggle with a leading label. Props: `label`, `supporting` (a
second line under the label in the secondary color: what the setting does),
`value`, `onValueChange`, `disabled`, `accentColor` (the on track), `style`,
`testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Toggle`, whose label is the row; with `supporting`, the toggle's own title and subtitle |
| Android | Material 3 `Switch` at the trailing edge of a Compose row, with a white thumb as on iOS |
| Web | react-native-web's switch in a drawn row |
| Windows | WinUI `ToggleSwitch` at the trailing edge of a drawn row |

On iOS and Android a switch outside a host mounts one of its own: the width
of its container with a label, of the switch without.

## Checkbox

A checked or unchecked box with a leading label. Props: `label`, `value`,
`onValueChange`, `disabled`, `accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | A tinted `checkmark.square` glyph in a plain `Button`. SwiftUI on iOS has no checkbox control; the glyph is the platform idiom. |
| Android | Material 3 `Checkbox`, with the whole row toggleable |
| Web | A real `<input type="checkbox">` inside a `<label>`, so the text toggles it |
| Windows | WinUI `CheckBox` at the trailing edge of a drawn row |

## TextField

A single or multi-line text input. Props: `placeholder` (also the row's
label), `value`, `onChangeText`, `onSubmit`, `onKeyPress`, `onFocus`,
`onBlur`, `disabled`, `secureTextEntry`, `keyboardType` (`default`, `email`,
`number`, `phone`, `decimal`, `url`), `autoCapitalize`, `autoCorrect`,
`multiline`, `autoFocus`, `returnKeyType` (`done`, `go`, `next`, `search`,
`send`), `submitBehavior` (`blurAndSubmit`, `submit`), `variant` (`row`,
`inline`, `bare`), `maxLength`, `accentColor`, `style`, `testID`, and a
`ref` with `focus` and `blur`.

The `row` variant is the platform's field with a form row's borderless look.
The `bare` variant is `inline` without the field's own padding and, on web,
without the browser's focus ring, for a field inside a box that draws both:
a `Composer`'s capsule, an `Alert`'s field. A multi-line field that submits
(`submitBehavior="submit"`) sends on Enter and breaks the line on Shift+Enter
on web, keeping the focus; an Enter that commits an input method's text, a
Japanese or Chinese word, commits it and sends nothing.
The `inline` variant is a React Native input for a field inside a React
Native layout on every platform; it focuses on mount with `autoFocus` and
makes sure the keyboard came on Android.

| Platform | `row` renders |
| --- | --- |
| iOS | SwiftUI `TextField` or `SecureField` |
| Android | Material 3 `TextField` with the filled look stripped |
| Web | react-native-web's `TextInput`, a real `<input>` |
| Windows | WinUI `TextBox` or `PasswordBox`, borderless |

Differences:

- `autoCapitalize` has no equivalent in the Windows row.
- In `inline` on Windows, `keyboardType` has no effect and `autoCapitalize`
  honours only `characters`: react-native-windows ignores the rest.
- `submitBehavior` is honoured on web and in `inline` on iOS and Android.
  Compose keeps the field focused after a submit, and on Windows Enter
  submits and keeps the focus whatever `submitBehavior` says.
  On Windows a multi-line `inline` field that submits sends on Enter and
  breaks the line on Shift+Enter.
- `onKeyPress` reaches `inline` and the web and Windows rows. In `inline`,
  iOS and Android report only the keys that write, Enter and Backspace;
  react-native-windows reports only the keys that type a character, Escape
  and Backspace among them, never an Enter that submits (in a one-line
  field, every Enter), and no Shift.
- `keyboardType` on web is also the field's `inputmode`, which a multi-line
  field takes.
- A multi-line `inline` field on web is a `<textarea>` one row tall: a
  browser that sizes a field to its content (`field-sizing`) grows it with
  its lines up to its `maxHeight`, and one that does not scrolls inside the
  row. The native inputs grow with their text.
- `onFocus`, `onBlur` and the `ref` reach `inline` and the web row, the
  React Native inputs. The SwiftUI, Compose and WinUI rows report no focus
  and take no commands.
- `onSubmit` on web fires for Enter but not Shift+Enter.
- `style` applies to the text on web and in `inline`.

## Composer

A capsule to write a message in, with a send button that is a stop button
while something runs: the bottom of a conversation, a comment thread, an
assistant's prompt.

Props: `value` and `onChangeText` (controlled; left out, the composer keeps
its own text and clears it on send), `placeholder` (`Message`), `onSend`
(called with the trimmed text from the button or the keyboard's send key;
nothing is sent while the text is blank or while `busy`), `onStop` (the
stop button while `busy`; without it the button waits), `busy`, `notice` (a
line under the capsule: a hint, an error, who else is typing),
`noticeColor` (`secondaryLabel`, or `destructive` for an error),
`sendLabel` (`Send`) and `stopLabel` (`Stop`, the buttons' accessible
names), `sendIcon` and `stopIcon` (the kit's arrow and stop square),
`onKeyPress` (a key pressed in the field, by its name and whether Shift
was held: Escape to close an assistant; on web and Windows the Enter that
sends stays the composer's), `autoCapitalize`, `autoCorrect` and `keyboardType` (the
field's, as on a `TextField`), `menu` (`label`, `icon`, `items`: the
platform's menu behind an icon button at the capsule's leading edge, for
what the message goes to), `disabled` (writing, sending and the menu; the
stop button stays live while `busy`, so a disabled composer can still stop
what it runs), `autoFocus`, `maxLength`, `style`, `testID`, and a `ref`
with the field's `focus` and `blur`, to put a phone's keyboard away as a
message sends or give the field the focus back.

Drawn in React Native on every platform: a `Surface` capsule holding a
`bare` `TextField` and the kit's circle `Button` in a host of its own, so
it sits in a `Sheet`'s footer or at the bottom of a screen. Enter sends and
Shift+Enter breaks the line on web and a desktop keyboard; the keyboard's
send key sends on a phone. While `busy` neither sends, and the text stays.
The capsule starts one line tall and grows with the text to five lines,
then scrolls; on web it grows where the browser sizes a field to its
content (`field-sizing`), and where the browser does not it stays one line
tall and scrolls inside.
On web the capsule draws the focus ring while the field has the focus.
A screen reader reads a new `notice` out, so an error after a failed send
is heard. On Android and web the notice is a polite live region, and on
iOS, which has no live regions, an announcement queued the same way: the
screen reader reads it once it is done speaking. On Windows, where
react-native-windows raises no event when a live region changes, it is an
announcement that Narrator reads at once, and a newer notice replaces one
it has not read yet. The notice the composer mounts with is not read.
The button is the platform's: a SwiftUI button, a
Material button, a `<button>`, a WinUI button. On Windows a `sendIcon` or
`stopIcon` with no `windows` glyph shows its label in its place.
The field is the `inline` variant's, so it hears what that hears and takes
the traits that takes: iOS and Android report no Escape to `onKeyPress`,
Windows reports no Shift, and on Windows `keyboardType` has no effect and
`autoCapitalize` honours only `characters`.

## SearchField

A field for searching: the query box, a way to clear it, and optionally a
list of completions under it. Props: `value`, `onChangeText`, `onSubmit`
(Enter, the platform's search key, or a completion taken), `placeholder`,
`suggestions`, `disabled`, `clearable` (default true), `autoFocus`,
`autoCapitalize`, `onFocus`, `onBlur`, `onKeyPress` (a key by its name),
`style`, `testID`, and a `ref` with `focus` and `blur`.

| Platform | Renders |
| --- | --- |
| iOS, Android | A drawn row: a magnifier, an inline `TextField`, a clear button, and a raised list of suggestions filtered to what the text contains. Compose's `SearchBar` takes a query it does not let the app set, so a controlled field cannot be built on it. |
| Web | `<input type="search">` with a `<datalist>`. The browser owns the combobox keyboard pattern and its own clear button. |
| Windows | WinUI `AutoSuggestBox`, which draws the box, the query glyph, the clear button and the list |

`clearable` is honoured on iOS and Android only; web and Windows have the
control's own clear button. A `<datalist>` entry is text only, so a
suggestion carries no icon on web. `autoCapitalize` has no Windows
equivalent. On Windows `focus` and `blur` through the `ref` ask the
`AutoSuggestBox`'s island for the focus through react-native-windows' focus
command.

## Picker

A dropdown that selects one option, with `Picker.Item` children (`label`,
`value`). Props: `label`, `selectedValue`, `onValueChange`, `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Picker` in the menu style |
| Android | A Compose row that mirrors the iOS form look, opening a Material `DropdownMenu`. The stock dropdown spans the row with no label. |
| Web | A drawn pill with a transparent native `<select>` over it, so the platform's own options popup opens |
| Windows | WinUI `ComboBox` at the trailing edge of a drawn row |

## SegmentedControl

A row of segments that selects one option, with `SegmentedControl.Item`
children. Props: `label`, `selectedValue`, `onValueChange`, `disabled`,
`accentColor` (the selected segment's fill), `size` (`small`, `medium`,
`large`), `shape` (`rounded`, `pill`), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Picker` in the segmented style |
| Android | Drawn in Compose from a shared geometry table. Material's own segmented button row hardcodes its shape and height and stamps a checkmark into the selected segment. |
| Web | A `radiogroup` of `radio` buttons with roving focus: one tab stop, and the arrows move and select |
| Windows | WinUI `SelectorBar`, a row with an accent underline on the selected item |

On Windows `size` and `shape` are not applied, since the control has one of
each, and `accentColor` colors the underline. On iOS `shape` matters for
`pill` only, since `rounded` is the system's own corner. On iOS and Android
a control outside a host mounts one of its own: the width of its container
with a label, of the segments without.

## Slider

A thumb dragged along a continuous or stepped range. Props: `label`, `value`,
`onValueChange` (continuous while dragging), `onSlidingComplete` (once on
release), `min` (0), `max` (1), `step` (omit for continuous), `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Slider` |
| Android | Material 3 `Slider`. The kit converts the increment into Compose's interval count and snaps the value itself. |
| Web | A real `<input type="range">` |
| Windows | WinUI `Slider`. A continuous slider moves by a thousandth of the range. |

## Stepper

A number adjusted with increment and decrement buttons. Props: `label`,
`value`, `onValueChange`, `step` (1), `min`, `max`, `formatValue`,
`disabled`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Stepper` with its label hidden, beside the kit's label and value |
| Android | Two Material 3 outlined icon buttons. Compose has no stepper. |
| Web | Two buttons in an iOS-style pill |
| Windows | WinUI `NumberBox` with inline spin buttons, which also takes a typed value |

`formatValue` is applied on iOS, Android and web. It is not applied on
Windows, where the box shows the number it edits.

## DateTimePicker

Picks a date, a time or both. Props: `label`, `value` (a `Date`, or a day as
`YYYY-MM-DD`), `onChange(date, day)`, `mode` (`date`, `time`, `datetime`),
`minimumDate`, `maximumDate` (a `Date` or a day), `disabled`, `accentColor`,
`presented`, `at`, `onDismiss`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DatePicker` in the compact style, one control for both parts |
| Android | A Compose row that opens the Material `DatePickerDialog`, then the `TimePickerDialog` for `datetime`. Android has no inline date and time control. |
| Web | A drawn pill with a native `<input type="date">`, `time` or `datetime-local` over it |
| Windows | WinUI `CalendarDatePicker` and `TimePicker`, one or both by `mode`. Each edits its own part of the value and keeps the other's. |

The bounds are honoured everywhere except by the Windows `TimePicker`, which
takes none.

A day written `YYYY-MM-DD` is a day in no time zone, a due date or a
birthday, read as its local midnight, and `onChange` hands back the local day
the new value falls on beside the `Date`, so a value kept as a day stays one.
Material's date dialog keeps its days in UTC; the kit hands it each day as
midnight UTC and reads its answer back the same way, so the day picked is the
day reported in every zone.

The year takes at least four digits, so the year 50 is `0050` and the year
12026 is `12026`, and a year before 0 takes a minus sign (`-0005`). The day
`onChange` hands back is written the same way, so it always reads back as a
`value`. A string that names no day the calendar has, such as `2026-02-30`, is no day: as a `value` the picker
keeps its own, and as a bound it bounds nothing. The browser's date input
takes no year before 1, so on web a day in the year `0000` leaves the input
empty. Where the bounds leave it open, Material's calendar on Android runs
from 1900 to 2100, widened to the value's year, and the Windows calendar runs
from 1900, or the value when it is earlier, to 2100, or the value when it is
later. Windows holds no day before 1601: a value before it leaves the field
empty, and a bound before it opens the calendar as far as 1601.

`presented` draws no row. It presents the platform's own picker over the
content, from `at` (the chip's rectangle, in the coordinates of the parent it
is laid over), for a date chip on a canvas the kit did not draw; `onDismiss`
is called when it closes, picked or not, after `onChange`. A day picked in
`date` mode closes it.

| Platform | Presented |
| --- | --- |
| iOS | A SwiftUI popover from the middle of the chip's bottom edge over React Native content, or from where the picker sits inside a host, holding the graphical calendar, or the wheels for a time. It closes on a tap outside. |
| Android | The Material dialogs: the date, then the time for `datetime`. They open in the middle of the screen whatever `at` says. Dismissing the time after a day was picked keeps the day. |
| Web | The browser's picker, opened with `showPicker()` from an unseen input laid over the chip. Where the browser refuses for want of a recent press, the input takes the focus and the keyboard edits it. It closes when the focus leaves or on Escape. |
| Windows | A `CalendarView` in a flyout under the chip, then a `TimePickerFlyout` for `datetime`, from a one-point island. A light dismiss after a day was picked keeps the day. |

## ColorPicker

A label with a color well that opens a color picker, optionally with preset
swatches. Props: `label`, `value` (`#RRGGBB` or `#RRGGBBAA`, or an empty
string for no color), `onValueChange`, `supportsOpacity` (default true),
`swatches` (colors, `{color, name}` swatches, or `system` for the platform's
own palette), `presentation` (`automatic`, `inline`, `popover`, `menu`),
`allowsNone`, `disabled`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `ColorPicker`, the system picker |
| Android | A Compose row that opens the iOS system picker redrawn in React Native (grid, spectrum, sliders, opacity, saved colors) in a `ModalBottomSheet` |
| Web | The same redrawn picker in a `Sheet` |
| Windows | A color well opening a `Flyout` with the WinUI `ColorPicker`: spectrum, sliders, hex field and, with `supportsOpacity`, the alpha channel |

Swatches are round on every platform, the selected one ringed, wrapping onto
further lines when they overflow. Tapping a swatch keeps the current opacity.
`swatches="system"` is the platform's own palette of twelve: Apple's system
colors on iOS and web, Material's on Android, the Windows accent colors on
Windows, each named for a screen reader and a menu. A swatch given as
`{color, name}` is called by its name in a menu and to a screen reader, as
the system palettes' colors are; a color given alone is called by its hex.
On Android a swatch carries its name as unseen text inside it, which
TalkBack reads with the swatch: `@expo/ui`'s Compose layer exposes no
modifier that sets a content description. For the same reason TalkBack
passes over the swatches of a disabled picker on Android, where iOS, web and
Windows announce them as unavailable buttons.

`allowsNone` adds a "No color" choice, a crossed-out circle before the
swatches and the first entry of a menu, reported as an empty string. An
empty `value` draws the well crossed out.

`presentation` says how a color is chosen, so it is chosen once from wherever
it is asked:

| `presentation` | iOS | Android | Web | Windows |
| --- | --- | --- | --- | --- |
| `automatic` | The row, the system picker from the well | The row, the picker in a bottom sheet | The row, the picker in a `Sheet` | The row, the picker in a flyout |
| `inline` | The row: SwiftUI cannot draw its picker in place, and presents it its own way | The picker drawn in place, the swatches over it, titled only when given a `label`, for a sheet of the app's own that would otherwise open a second sheet | The same | The WinUI `ColorPicker` itself in place, under the label when given one |
| `popover` | The row: the system picker is a popover on an iPad and a sheet on a phone | The picker in a Material dialog, over a sheet the row is in: Material has no popover | The picker in a native popover placed against the well | The row: the flyout is a popover already |
| `menu` | SwiftUI's `Menu` of the swatches from a well | A Material `DropdownMenu` of the swatches from the well | The kit's menu popover from the well | A `MenuFlyout` of the swatches from a drawn well |

On Android and web, a picker in a sheet, a dialog or a popover is titled with
`label`, or "Colors" without one. A swatch picked from a menu is opaque. On
web the well of a `popover` or `menu` picker takes its popover target once
the page has hydrated, as the `Menu`'s trigger does, so on a static page a
press before then does nothing.

A drag across the drawn picker's spectrum or a slider stays with the picker
in a sheet. On web the `Sheet`'s drawer leaves a drag that starts on them
alone, and on Android the picker keeps the sheet around an `inline` picker
from intercepting it, as the sheet the row opens has its gestures off.
