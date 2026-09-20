# Layout

[Docs home](../README.md)

The pieces a screen is built from: the screen itself, surfaces, bars, forms and
rows.

Everything is exported from `expo-interface`. Each entry says what the component
does, which props it takes, what each platform renders, and where the platforms
differ. [All components](README.md) lists the other groups.

## Screen

The root of a route: background, safe areas, status bar, a shared maximum
content width, an optional native host and a slot for a floating action
button.

Props: `native` (mount an `@expo/ui` host around the screen), `header`
(the screen sits under a stack header and skips the top inset; inferred under
`TabStack`), `gutter` (horizontal padding), `fab` (a node placed at the bottom
trailing corner, above the safe area and the tab bar).

| Platform | Renders |
| --- | --- |
| iOS, Android | `SafeAreaView`, `StatusBar` styled for the scheme, the window background painted through `expo-system-ui`, and with `native` an accent-seeded `@expo/ui` `Host` |
| Web | The same, with the background as the palette's CSS variable so a static export is in the right scheme before any JavaScript runs; the fab slot is fixed to the viewport |
| Windows | A plain view. A desktop window has no safe areas, no status bar and no `@expo/ui` host; `native` only marks the tree as hosted so self-hosting components render bare |

Content is capped at 800 points and centered on every platform.

## ScreenHeader

A header bar with a title, an optional back button and a trailing slot, for a
screen that draws its own header.

Props: `title`, `onBack`, `trailing`, `dragRegion` (Windows: the row drags
the window while the content is in the title bar).

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A 64-point row under the status bar (under the floating tab bar on web), a chevron or arrow back button, a single-line title |
| Windows | A 48-point row like a WinUI title row, a Segoe back glyph, the caption buttons' room left at the ends, and `titleNode` and `leading` slots |

## NativeHost

A native host around a group of controls, for a screen that cannot be native
as a whole. See [Native hosts](../hosts.md).

## Surface

A box in the theme's colors: a bar under a canvas, a floating strip of tools,
a card, a drop target, a notice. The one kit component that is React Native
on every platform, so it can hold what is not native.

Props: `color` (`background`, `element`, `selected`, `none`), `border`
(`none`, `all`, `top`, `bottom`), `dashed`, `borderColor`, `radius` (a number
or `pill`), `raised` (a soft shadow), `padding`, `onPress`, `onLongPress`,
`disabled`, `label` (the accessible name of a pressable surface), `onLayout`,
`style`, `testID`.

Differences:

- A pressed surface dims on iOS, Android and web. On Windows it paints
  WinUI's state fills instead (the subtle fill under the pointer, the tertiary
  fill while pressed), reacts to hover, takes the focus ring, and presses on
  Enter and Space.
- On web a pressable surface is a real `<button>`.

## Card

A pressable `Surface` with slots: a document in a list, a space on a
dashboard.

Props: `header`, `children` (the body), `footer`, `overlay` (controls floated
over the trailing edge, level with the footer), `badge` (the top trailing
corner), `onPress`, `onLongPress`, `label`, `padding` (12), `gap` (8),
`disabled`, `style`, `testID`.

The same file draws it on every platform. `overlay` and `badge` are siblings
of the card's press target, not children, so a button inside them takes its
own press. Put actions in `overlay`, not in the body.

## Toolbar

A bar of tools along a canvas: an editor's status bar, the strip over a
drawing, the row under a preview.

Props: `commands` (the bar described as data: `label`, `icon`, `onPress`,
`secondary`, `disabled`, `role`, `separator`, `testID` per command), or
`leading` and `trailing` nodes; `field` (a `TextField variant="inline"` that
grows into the space the controls leave); `placement` (`top` or `bottom`;
the rule goes on the side facing the content); `density` (`regular` or
`compact`); `children` (a second row under the controls); `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` bar. The controls sit in one native host as a single row, so a bar of buttons and menus costs one host rather than one per control. With `commands`, the kit draws them as text buttons and puts the `secondary` ones behind a `Menu` labelled "More". |
| Windows | With `commands` and no `field`, a WinUI `CommandBar` island: the control lays the commands out, moves the ones that do not fit into its own overflow menu, and draws labels beside the icons (`compact` drops them and leaves the naming to the overflow). Otherwise a drawn bar of islands. |

Differences:

- A command marked `secondary` is in the overflow on every platform. Only
  Windows moves further commands there as the bar narrows.
- A `field` sends every platform to the drawn path: a text field is a React
  Native input and cannot live inside a `CommandBar`.
- `leading` and `trailing` are ignored when `commands` are given.

## KeyboardBar

A bottom bar that sticks to the keyboard. It rides up by a transform, never a
resize, and reports the keyboard's height through `onKeyboard` so the content
above can pad or scroll by that much.

| Platform | How |
| --- | --- |
| iOS, Android | `react-native-keyboard-controller`, an optional peer the kit loads only natively. `AccentProvider` mounts its provider when the library is installed. Without it the bar is a plain view. |
| Web | A plain view. The browser keeps the page above the keyboard itself, and the library never reaches the web bundle. |
| Windows | React Native's keyboard events, which `expo-windows` raises from the window's touch keyboard with the rectangle it covers. The bar measures its own bottom edge, so the two meet whatever the window's height has become. Without the runtime nothing fires and the bar stays put. |

```sh
npx expo install react-native-keyboard-controller
```

## FieldGroup

A scrollable settings form: titled sections of rows, each with an optional
note under it. `FieldGroup`, `FieldGroup.Section`, `FieldGroup.SectionHeader`
and `FieldGroup.SectionFooter`.

Section props: `title`, `titleUppercase`, `footer` (a note under the rows),
`footerColor` (`secondaryLabel` or `destructive`, for an error), plus the
`@expo/ui` base props.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Form` sections through `@expo/ui` |
| Android | The Material 3 grouped list drawn in Compose: a scrolling column of sections with the per-row corner radii of a grouped list. Not a lazy list, which would re-add hosted React Native rows to the view tree as it scrolls. |
| Web | `@expo/ui`'s universal `FieldGroup`, recolored to the kit's tokens |
| Windows | The Settings app's layout, drawn: a body-strong heading over a card of rows divided by hairlines, with the note under it |

Differences:

- `titleUppercase` is ignored on iOS, where the `Form` decides the header
  case.
- A kit `ListItem` inside a section is rendered flush, since the section
  already insets its rows. A row that asks for `inset` explicitly keeps it.

A `Sheet` full of one is how the kit does a form: the question is the
section's title and the note under it is the footer.

```tsx
<Sheet isPresented={open} onDismiss={close}>
  <FieldGroup>
    <FieldGroup.Section title="Rename document" footer="The name is shown to everyone with the link.">
      <TextField value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmit={save}/>
      <Button label="Save" onPress={save}/>
    </FieldGroup.Section>
  </FieldGroup>
</Sheet>
```

## ListItem

A settings-style row with leading and trailing slots, supporting text, a
trailing action and the row's own actions.

Props: `children` (the headline), `leading`, `trailing`, `supporting`,
`action` (`label`, `onPress`, `disabled`, `role`, `variant` `text` or
`filled`), `swipeActions` (`label`, `onPress`, `icon`, `role`, `disabled`
per action), `inset` (default true), `onPress`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | `@expo/ui`'s SwiftUI list row, with `swipeActions` as real swipe actions on the trailing edge. A full swipe runs the destructive one. |
| Android | The Material 3 `ListItem`, or a plain row when `inset` is off, since the control's padding cannot be removed |
| Web | A drawn row in the DOM. The row is a `<button>` when pressable, and an `action` is a sibling button beside it, since buttons cannot nest. |
| Windows | A drawn row with a WinUI settings card's metrics, WinUI's state fills under the pointer |

Differences:

- Only iOS has a swipe. On Android, web and Windows the same actions are the
  row's context menu, opened by a long press or a right click, and the row's
  press goes through that menu's trigger so one gesture has one owner. Do not
  wrap the row in a `ContextMenu` as well.
- `inset` has nothing to turn off on iOS, where the `Form` supplies every
  inset.

## Collapsible

A tappable header that shows or hides its content. Controlled with
`expanded` and `onExpandedChange`, or uncontrolled with `defaultExpanded`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DisclosureGroup` |
| Android | `@expo/ui`'s Material 3 expandable list item |
| Web | A real `<details>` and `<summary>` |
| Windows | A drawn header row with a Segoe chevron. WinUI's `Expander` is the same row, but its content would have to be XAML, and a collapsible holds React Native content. |

`children` must be `@expo/ui` content on iOS and Android.

## Divider

A hairline separator. Props: `vertical`, `color`, `inset`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Divider`. The surrounding stack decides the orientation; `vertical` only picks the inset's axis. |
| Android | Material 3 `HorizontalDivider` or `VerticalDivider` |
| Web | A real `<hr>` |
| Windows | A hairline view in the separator color, the stroke WinUI's dividers use |

## EmptyState

What a screen shows when it has nothing to show: no drops yet, no results, no
connection. Props: `title`, `description`, `icon`, `action` (usually a
`Button`, drawn below the description), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS 17 and later | The system's `ContentUnavailableView`, with the `action` under it as React Native |
| Older iOS, Android, Web | A drawn column with the icon through `SymbolView` |
| Windows | The same column with a Segoe glyph |

The drawn layout is one accessibility element that reads the title and the
description together.
