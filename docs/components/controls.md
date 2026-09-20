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
`iconSize`, `prefixIcon`, `suffixIcon`, `hideLabel`, `disabled`, `fillWidth`,
`testID`. Web only: `popoverTarget` and `popoverTargetAction`, so the browser
manages a popover's open state, `aria-expanded` and light dismiss without
JavaScript.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` in the bordered-prominent, bordered or plain style |
| Android | Material 3 `Button`, `OutlinedButton` or `TextButton`, or the icon buttons when icon-only. `size: 'inline'` is a clickable row, since Material's buttons keep a minimum height no modifier can shrink. |
| Web | A real `<button>` |
| Windows | WinUI `Button`: the accent style for `filled`, the standard one for `outlined`, transparent for `text`, with Segoe glyphs |

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
no presentation binding, so iOS never reports it.

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
`testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` with the selected trait while on |
| Android | Material 3 `IconToggleButton` |
| Web | `<button aria-pressed>` |
| Windows | WinUI `ToggleButton` holding a `FontIcon`, with the two colors in place of the control's checked fill |

On Windows a token with no Segoe glyph renders nothing.

## Switch

An on/off toggle with a leading label. Props: `label`, `value`,
`onValueChange`, `disabled`, `accentColor` (the on track), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Toggle`, whose label is the row |
| Android | Material 3 `Switch` at the trailing edge of a Compose row, with a white thumb as on iOS |
| Web | react-native-web's switch in a drawn row |
| Windows | WinUI `ToggleSwitch` at the trailing edge of a drawn row |

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
label), `value`, `onChangeText`, `onSubmit`, `onKeyPress`, `disabled`,
`secureTextEntry`, `keyboardType` (`default`, `email`, `number`, `phone`,
`decimal`, `url`), `autoCapitalize`, `autoCorrect`, `multiline`, `autoFocus`,
`returnKeyType` (`done`, `go`, `next`, `search`, `send`), `submitBehavior`
(`blurAndSubmit`, `submit`), `variant` (`row`, `inline`), `maxLength`,
`accentColor`, `style`, `testID`.

The `row` variant is the platform's field with a form row's borderless look.
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

- `autoCapitalize` has no Windows equivalent.
- `submitBehavior` is honoured on web and in `inline`. Compose keeps the field
  focused after a submit, and on Windows Enter submits and keeps the focus.
- `onKeyPress` reaches `inline` and the web and Windows rows.
- `onSubmit` on web fires for Enter but not Shift+Enter.
- `style` applies to the text on web and in `inline`.

## SearchField

A field for searching: the query box, a way to clear it, and optionally a
list of completions under it. Props: `value`, `onChangeText`, `onSubmit`
(Enter, the platform's search key, or a completion taken), `placeholder`,
`suggestions`, `disabled`, `clearable` (default true), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android | A drawn row: a magnifier, an inline `TextField`, a clear button, and a raised list of suggestions filtered to what the text contains. Compose's `SearchBar` takes a query it does not let the app set, so a controlled field cannot be built on it. |
| Web | `<input type="search">` with a `<datalist>`. The browser owns the combobox keyboard pattern and its own clear button. |
| Windows | WinUI `AutoSuggestBox`, which draws the box, the query glyph, the clear button and the list |

`clearable` is honoured on iOS and Android only; web and Windows have the
control's own clear button. A `<datalist>` entry is text only, so a
suggestion carries no icon on web.

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
`pill` only, since `rounded` is the system's own corner.

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

Picks a date, a time or both. Props: `label`, `value`, `onChange`, `mode`
(`date`, `time`, `datetime`), `minimumDate`, `maximumDate`, `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DatePicker` in the compact style, one control for both parts |
| Android | A Compose row that opens the Material `DatePickerDialog`, then the `TimePickerDialog` for `datetime`. Android has no inline date and time control. |
| Web | A drawn pill with a native `<input type="date">`, `time` or `datetime-local` over it |
| Windows | WinUI `CalendarDatePicker` and `TimePicker`, one or both by `mode`. Each edits its own part of the value and keeps the other's. |

The bounds are honoured everywhere except by the Windows `TimePicker`, which
takes none.

## ColorPicker

A label with a color well that opens a color picker, optionally with preset
swatches. Props: `label`, `value` (`#RRGGBB` or `#RRGGBBAA`),
`onValueChange`, `supportsOpacity` (default true), `swatches`, `disabled`,
`style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `ColorPicker`, the system picker |
| Android | A Compose row that opens the iOS system picker redrawn in React Native (grid, spectrum, sliders, opacity, saved colors) in a `ModalBottomSheet` |
| Web | The same redrawn picker in a `Sheet` |
| Windows | A color well opening a `Flyout` with the WinUI `ColorPicker`: spectrum, sliders, hex field and, with `supportsOpacity`, the alpha channel |

Swatches are round on every platform, the selected one ringed, wrapping onto
further lines when they overflow. Tapping a swatch keeps the current opacity.
