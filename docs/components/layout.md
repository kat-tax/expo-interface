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
`TabStack`), `gutter` (horizontal padding), `underBar` (the content starts
under the bar floating over the screen's top rather than below it, for a
scrolling screen that passes under a material bar: the web tab bar, or on
iOS the header of a `TabStack` with a `material`; the kit's `List` and
`CardGrid` pad their first row by the bar themselves, and other scroll
content reads `useScrollInsets()`, which is the bar's inset under such a
screen and nothing elsewhere, with any insets passed to it added), `fab` (a
node placed at the bottom
trailing corner, above the safe area and the tab bar, lifted above a `Toast`
while one shows and above a bar the screen draws at its bottom).

A control in the content can give the screen a bar of its own: a
`HeaderSearch` whose placement the platform has no header for puts its row
above the content (Android's `stacked`) or its bottom bar below it
(`integrated`), and the screen draws them at its edges, outside the content's
host and clear of its gutter.

| Platform | Renders |
| --- | --- |
| iOS, Android | `SafeAreaView`, `StatusBar` styled for the scheme, the window background painted through `expo-system-ui`, and with `native` an accent-seeded `@expo/ui` `Host`. Under a header the screens run under, the header's height stays clear at the top. Under the platform's tab bar on Android the bottom inset is the tab host's, which keeps its screens above the navigation bar itself: a safe-area view there measures from the host, not the window, and would pay it twice. |
| Web | The same, with the background as the palette's CSS variable so a static export is in the right scheme before any JavaScript runs; the fab slot is fixed to the viewport |
| Windows | A plain view. A desktop window has no safe areas, no status bar and no `@expo/ui` host; `native` only marks the tree as hosted so self-hosting components render bare |

Content is capped at 800 points and centered on every platform.

## ScreenHeader

A header bar with a title, an optional back button and a trailing slot, for a
screen that draws its own header.

Props: `title`, `onBack`, `trailing`, `material` (web: `none`, `thin`,
`regular`, `thick`), `dragRegion` (Windows: the row drags the window while
the content is in the title bar).

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A 64-point row under the status bar (under the floating tab bar on web), a chevron or arrow back button, a single-line title. On web `material` thins the background over a blur of what the app lays under the bar, with a hairline along the bottom edge, and is solid where the blur cannot be had or is not wanted. |
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
dashboard, a cell of a `CardGrid`.

Props: `media` (a picture bleeding to the card's edges above everything
else, clipped to its corners), `header`, `children` (the body), `title` and
`subtitle` (the footer the kit draws: one line each, with room at the
trailing edge for the menu), `footer` (a footer of the app's own, in place
of `title`), `menu` (the card's own actions, as the platform's menu behind
an ellipsis level with the footer), `favorite` (`value`, `onValueChange`,
`label`: a star over the top trailing corner, filled while it is set),
`overlay` (controls of the app's own floated over the trailing edge, level
with the footer), `badge` (the top trailing corner), `onPress`,
`onLongPress`, `label` (defaults to the title and the subtitle), `padding`
(12), `gap` (8), `disabled`, `style`, `testID`.

The same file draws it on every platform. The menu and the star are the
kit's own controls, so they are the platform's: a SwiftUI `Menu` and a
`Button` with the selected trait, Compose's `DropdownMenu` and
`IconToggleButton`, a popover and an `aria-pressed` button on web, a WinUI
`MenuFlyout` and `ToggleButton`. The menu is centred on the footer once the
footer has been laid out. `menu`, `favorite`, `overlay` and `badge` are
siblings of the card's press target, not children, so a button inside them
takes its own press. Put actions there, not in the body.

While the star is not set it is drawn only while a pointer is over the card
or the keyboard is in it, where a pointer can hover (web under
`(hover: hover)`, Windows), and always on iOS, Android and a touch screen on
web, where nothing hovers. On Windows the keyboard cannot reveal it, since
the focus moves between XAML islands without the React Native tree seeing it
go; put the same action in `menu` for a keyboard. On Android the star draws
the `star` vector the app registers (see [Icons](../icons.md)), and the
ellipsis `more_horiz`; `expo-interface-symbols` writes both whether or not
the app's own sources name them. On web the card is a `<button>` whose text
starts at the leading edge, as a box's does.

## Toolbar

A bar of tools along a canvas: an editor's status bar, the strip over a
drawing, the row under a preview.

Props: `commands` (the bar described as data: `label`, `icon`, `hideLabel`,
`active`, `tone`, `onPress`, `secondary`, `disabled`, `role`, `separator`,
`testID` per command), or `leading` and `trailing` nodes; `field` (a `TextField variant="inline"` that
grows into the space the controls leave); `placement` (`top` or `bottom`;
the rule goes on the side facing the content); `density` (`regular` or
`compact`); `children` (a second row under the controls); `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` bar. The controls sit in one native host as a single row, so a bar of buttons and menus costs one host rather than one per control. With `commands`, the kit draws them as text buttons at the platform's own bar metrics (a 22pt symbol at the bar button's size on iOS, as the header's actions, spaced to the 44pt pitch of a toolbar's items; a 22dp icon in Material's 48dp icon button on Android, which is the bar's height and the pitch there; the kit's small button on web) and puts the `secondary` ones behind a `Menu` labelled "More". A command that is `active` is drawn filled; `tone` draws the others in the label color, for a row of tools where the accent marks the active one; `hideLabel` keeps the icon alone. |
| Windows | With `commands` and no `field`, a WinUI `CommandBar` island: the control lays the commands out, moves the ones that do not fit into its own overflow menu, and draws labels beside the icons (`compact` drops them and leaves the naming to the overflow). Otherwise a drawn bar of islands. |

Differences:

- A command marked `secondary` is in the overflow on every platform. Only
  Windows moves further commands there as the bar narrows.
- A `field` sends every platform to the drawn path: a text field is a React
  Native input and cannot live inside a `CommandBar`.
- `leading` and `trailing` are ignored when `commands` are given.
- Controls given as `leading` and `trailing` draw at the size the app gives
  them, spaced by `density`; the bar's metrics and pitch are the `commands`'
  alone, whatever the density.
- A command's `hideLabel`, `active` and `tone` are the drawn bar's. The
  Windows `CommandBar` decides its own labels (`density`), has no on state
  for a command and takes no tone: a command is in the bar's own colors, a
  `destructive` one in the critical color.

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

A settings-style row with an icon, leading and trailing slots, supporting
text, a value, a badge, a trailing action and the row's own actions.

Props: `children` (the headline), `icon` (an `IconToken` at the start,
drawn by the kit at the row's size in `iconTone`, default `secondary`,
before any `leading` content), `leading`, `trailing`, `supporting`, `value`
(text at the trailing edge in the secondary color, before `trailing`: a
setting's value, a file's size), `badge` (`true` for a dot, a number for a
count, as the kit's `Badge` at the trailing edge), `selected` (the current
row, in the selected fill and announced as selected), `action` (`label`,
`onPress`, `disabled`, `loading`, `role`, `variant` `text` or `filled`),
`swipeActions` (`label`, `onPress`, `icon`, `role`, `disabled` per action),
`inset` (default true), `onPress`, `testID`.

A row whose headline is a string is named from its slots on every platform:
"Essay, Edited, 2 KB, 3 new" for a headline, supporting text, value and
badge, so a screen reader hears the row as one thing. A headline of the
app's own content keeps whatever name that content has.

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
- On iOS and Android a row outside a host (a React Native `ScrollView` of
  rows) mounts a host of its own, so it draws there too. See
  [Native hosts](../hosts.md).

## List

A list of rows that grows: the inbox, the versions of a document, the
members of a space. The rows are `ListItem`s and the list is the platform's
own lazy one, so three thousand rows cost what the screen shows.

Props: `data`, `renderItem(item, index)`, `keyExtractor` (the index when
left out), `separators` (default true), `header`, `footer`, `empty` (what
shows in place of the rows when there are none, usually an `EmptyState`),
`onEndReached` (called once the last row has been drawn, for a list that
loads more), `estimatedItemHeight` (default 56: what the web lays out for a
row before it comes into view, and what Windows jumps by), `contentInset`
(`top`, `bottom`, the space inside the list before the first row and after
the last), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `List` in the plain style: it recycles its rows, draws its own separators and scrolls under a translucent bar |
| Android | Compose `LazyColumn`, with a Material `HorizontalDivider` between the rows |
| Web | A DOM list whose rows the browser lays out as they come into view (`content-visibility: auto`), with hairlines between them |
| Windows | React Native's `FlatList`, windowed |

Differences:

- On iOS and Android a row is native content, as a row in a `FieldGroup`
  is: the kit's `ListItem`, or `@expo/ui` content. A React Native view
  inside a row is hosted a second time each time the list recycles it, so a
  row that needs one belongs in a `CardGrid`, which is drawn in React
  Native. The `header`, `footer` and `empty` content are native there too.
- Outside a host the list mounts one that fills the screen (`NativeHost
  fit="fill"`); under `Screen native` it uses the screen's.
- Under a `Screen underBar` the list pads its first row by the bar through
  `useScrollInsets()`, with `contentInset` added to that.

## CardGrid

A grid of cards that grows: the documents of a workspace, the photos of a
drop, the spaces on a dashboard. The columns come from the width: as many
cards of at least `minItemWidth` as fit, up to `maxColumns`, so a phone
holds two and a desk four without the app measuring anything.

Props: `data`, `renderItem(item, index)` (one cell, usually a `Card`, which
fills the cell's width), `keyExtractor`, `minItemWidth` (default 150),
`maxColumns` (default 4), `gap` (default 12, on both axes), `header`,
`footer`, `empty`, `onEndReached`, `estimatedItemHeight` (default 180),
`contentInset`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Windows | React Native's `FlatList` of rows, windowed, with the column count worked out from the measured width; a short last row keeps its cells the width of the others |
| Web | A CSS grid, each cell laid out as it comes into view (`content-visibility: auto`) |

Differences:

- Drawn in React Native on every platform, like `Card`, because a card
  holds what is not native: a preview, a thumbnail. A list of rows is
  `List`.
- Under a `Screen underBar` the grid pads its first row by the bar through
  `useScrollInsets()`, and on iOS its scroll indicators with it.

## Collapsible

A tappable header that shows or hides its content. Controlled with
`expanded` and `onExpandedChange`, or uncontrolled with `defaultExpanded`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DisclosureGroup` |
| Android | `@expo/ui`'s Material 3 expandable list item |
| Web | A real `<details>` and `<summary>` |
| Windows | A WinUI `Expander`, with the React Native content inside its content area through a portal (see [Windows](../platforms/windows.md#islands)). The content slides out from under the header and back as WinUI's own does, and leaves the accessibility tree and the tab order while the control is closed. |

`children` must be `@expo/ui` content on iOS and Android.

## Divider

A hairline separator. Props: `vertical`, `color`, `inset`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Divider`. The surrounding stack decides the orientation; `vertical` only picks the inset's axis. |
| Android | Material 3 `HorizontalDivider` or `VerticalDivider` |
| Web | A real `<hr>` |
| Windows | A hairline view in the separator color, the stroke WinUI's dividers use |

On iOS and Android a rule outside a host mounts one of its own, so it draws
between React Native views too: as wide as its container, or, vertical, as
tall as its row. See [Native hosts](../hosts.md).

## EmptyState

What a screen shows when it has nothing to show: no drops yet, no results, no
connection. Props: `title`, `description`, `icon`, `action`, `loading`,
`selectable`, `style`, `testID`.

`action` is the one thing to do about it, as data: `label`, `onPress`,
`variant` (`filled` by default), `icon`, `disabled`, `loading`. The kit draws
it as its own `Button` inside the platform's view, so natively the action is
native beside native text rather than a React Native hop between the two. A
node of the app's own is drawn below the view in React Native instead.
`loading` puts the platform's spinner in the icon's place, so a screen waiting
for its record is the same empty state as one that has none. The description
wraps at the screen's width and can be selected and copied, unless
`selectable` is off.

| Platform | Renders |
| --- | --- |
| iOS 17 and later | The system's `ContentUnavailableView` and the action in one host that fills the width. While `loading` the same layout is composed in SwiftUI, with a `ProgressView` where the symbol goes. |
| Older iOS, Web | A drawn column with the icon through `SymbolView`, the kit's `Spinner` while loading |
| Android | A Compose column in one host: the token's drawable, the title and the description in the Material scale, the `CircularProgressIndicator` while loading, and the action as the Material button. A node of the app's own rides in the column as hosted React Native content. |
| Windows | The drawn column with a Segoe glyph, the WinUI `ProgressRing` while loading |

The drawn layout is one accessibility element that reads the title and the
description together. The Compose column reads them as the two texts they
are, since `@expo/ui`'s Compose layer sets no description on a column.
