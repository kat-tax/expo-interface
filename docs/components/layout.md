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
`CardGrid` pad their first row by the bar themselves, as `FieldGroup` pads
its content, a scroll view of the app's own is a
[`ScreenScrollView`](#screenscrollview), and other scroll content reads
`useScrollInsets()`, whose `top`
is the bar's inset under such a screen and whose `bottom` is the room the tab
bar's floating action takes on any screen under the tabs (Android, and iOS
before 26), nothing elsewhere, with any insets passed to it added, and whose
`left` and `right` are only those passed to it, since a screen keeps nothing
at the sides; on iOS
its `automatic` says the platform insets the content itself, and `top` is
then only what floats under the header), `fab` (a node placed at the bottom
trailing corner, above the safe area and the tab bar, lifted above a `Toast`
while one shows and above a bar the screen draws at its bottom).

Read `useScrollInsets()` in a component the `Screen` renders: the component
that renders the `Screen` is outside it and reads nothing. Inside a `Sheet`
both are zero, whatever screen it opens from.

A control in the content can give the screen a bar of its own: a
`HeaderSearch` whose placement the platform has no header for puts its row
above the content (Android's `stacked`) or its bottom bar below it
(`integrated`), and the screen draws them at its edges, outside the content's
host and clear of its gutter. The rows at the top span the screen's width at
their own height, with the content right under them. A `HeaderAccessory` on
iOS and Android puts its row at the top the same way, across the screen with
the content right under it; under a header the screens run under, the row
floats at the header's bottom edge, and the screen pays its measured height
as it pays the header's.

| Platform | Renders |
| --- | --- |
| iOS, Android | `SafeAreaView`, `StatusBar` styled for the scheme, the window background painted through `expo-system-ui`, and with `native` an accent-seeded `@expo/ui` `Host`. Under a header the screens run under, the header's height stays clear at the top. Under the platform's tab bar on Android the bottom inset is the tab host's, which keeps its screens above the navigation bar itself: a safe-area view there measures from the host, not the window, and would pay it twice. |
| Web | The same, with the background as the palette's CSS variable so a static export is in the right scheme before any JavaScript runs; the fab slot is fixed to the viewport, above its bottom safe area |
| Windows | A plain view. A desktop window has no safe areas, no status bar and no `@expo/ui` host; `native` only marks the tree as hosted so self-hosting components render bare |

Content is capped at 800 points and centered on every platform.

## ScreenScrollView

A vertical React Native `ScrollView` for a screen's own content (an
article's text, a drawn list) that pads its content by the screen's insets:
the bar it passes under on a `Screen underBar`, and the tab bar's floating
action at its bottom. They are added to the top and bottom padding its
`contentContainerStyle` gives in points; an edge with no inset keeps its
padding as it is, and a percentage on an edge with one is replaced by the
inset. Render it in the screen's content, under the `Screen` whose insets it
reads.

On iOS, on a `Screen underBar` under a header the screen runs under, it
takes UIKit's own inset (`contentInsetAdjustmentBehavior="automatic"`,
whatever the app passes for it), which follows a native search bar, and pads
only for a `HeaderAccessory` floating under the header. On iOS its scroll
indicators are inset with the content unless `scrollIndicatorInsets` says
otherwise; on the other platforms they span the whole view. A press on a
control in it acts while the keyboard is up (`keyboardShouldPersistTaps` is
`handled` unless set). It takes every `ScrollView` prop and a `ref`.

```tsx
<Screen underBar>
  <ScreenScrollView contentContainerStyle={{padding: 16}}>
    <Typography>{terms}</Typography>
  </ScreenScrollView>
</Screen>
```

| Platform | Renders |
| --- | --- |
| iOS, Android | React Native's `ScrollView`, padded by the bar on a `Screen underBar` (on iOS under a header the screen runs under, UIKit's inset and the rows floating under the header) and by the tab bar's floating action |
| Web | react-native-web's `ScrollView`, padded by the tab bar on a `Screen underBar` |
| Windows | React Native's `ScrollView` with the keyboard default above and no padding of its own: the Windows `Screen` has no insets to pad by |

## ScreenHeader

A header bar with a title, an optional back button and a trailing slot, for a
screen that draws its own header.

Props: `title`, `onBack`, `trailing`, `material` (web: `none`, `thin`,
`regular`, `thick`), `dragRegion` (Windows: the row drags the window while
the content is in the title bar).

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A 64-point row under the status bar (under the floating tab bar on web), a back button drawn as the kit's `Icon` (a chevron on iOS, an arrow on Android and web), a single-line title. On web `material` thins the background over a blur of what the app lays under the bar, with a hairline along the bottom edge, and is solid where the blur cannot be had or is not wanted. |
| Windows | A 48-point row like a WinUI title row, a Segoe back glyph, the caption buttons' room left at the ends, and `titleNode` and `leading` slots |

## NativeHost

A native host around a group of controls, for a screen that cannot be native
as a whole. See [Native hosts](../hosts.md).

## Surface

A box in the theme's colors: a bar under a canvas, a floating strip of tools,
a card, a drop target, a notice. The one kit component that is React Native
on every platform, so it can hold what is not native.

Props: `color` (`background`, `element`, `selected`, `none`), `border`
(`none`, `all`, `top`, `bottom`), `dashed`, `borderColor` (a palette token
such as `opaqueSeparator`, which follows the scheme, or any color;
`separator` by default), `radius` (a number or `pill`), `raised` (a soft
shadow), `padding`, `onPress`, `onLongPress`, `disabled`, `label` (the
accessible name of a pressable surface), `suppressNativeMenu` (web only:
the browser's context menu does not open over the surface, for a canvas or
an editor with menus of its own), `onLayout`, `ref` (the surface's view,
to measure it with `useKeyboardInset`, `useDrop` or `measureInWindow`; the
DOM element on web), `style`, `testID`.

Differences:

- A pressed surface dims on iOS, Android and web. On Windows it paints
  WinUI's state fills instead (the subtle fill under the pointer, the tertiary
  fill while pressed), reacts to hover, takes the focus ring, and presses on
  Enter and Space.
- On web a pressable surface is a real `<button>`.

## Material

A view on the platform's material, with its children on top: a strip of tabs
floating over scrolling content, a panel over a photo. On web it is the
material the kit's own bars are drawn in.

```tsx
<Material kind="glass" edge="bottom" style={{position: 'absolute', top: barInset, left: 0, right: 0}}>
  <TabStrip/>
</Material>
```

Props: `kind` (`thin`, `regular`, `thick`, or `glass`; `regular` by default),
`fill` (the palette fill the material is made of on web and Android:
`background` by default, or `element`), `edge` (where the hairline goes:
`all`, `top`, `bottom`, or `none` by default), `radius`, `onLayout`,
`style`, `testID`.

| Platform | What it draws |
| --- | --- |
| iOS | A SwiftUI shape filled with the system material, in a host of its own behind the children. `glass` is Liquid Glass from iOS 26, and the regular material before it. |
| Android | The palette fill, opaque. Material 3 has no material that shows what passes under it. |
| Web | The palette fill thinned over a blur of what passes under it, by the stylesheet the tab bar and `ScreenHeader` use. Solid where the blur cannot be had or is not wanted, and a frame in forced colors. `glass` is the regular material. |
| Windows | Acrylic: an `ExpoInterfaceMaterial` island with the children inside it through a portal. `thin` is the thin acrylic, `thick` the base acrylic, and `glass` the default one. The backdrop is drawn from what is behind the window, to the island's rectangle; a radius rounds the box. |

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
`active`, `tone`, `color`, `onPress`, `items`, `secondary`, `disabled`, `role`,
`separator`, `testID` per command), or `leading` and `trailing` nodes; `field` (a `TextField variant="inline"` that
grows into the space the controls leave); `placement` (`top` or `bottom`;
the rule goes on the side facing the content); `density` (`regular` or
`compact`); `children` (a second row under the controls); `fieldCommands`
(commands beside the field, at its trailing edge, in the trailing group's
host); `foldCommands` (puts the `commands` behind the overflow while the bar
is in the compact size class); `floating`; `at`, `align` (`center` by
default, `start` or `end`), `preferredEdge` (`top` by default) and `insets`,
for a bar floating beside a rectangle; `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` bar. The controls sit in one native host as a single row, so a bar of buttons and menus costs one host rather than one per control. With `commands`, the kit draws them as text buttons at the platform's own bar metrics (a 22pt symbol at the bar button's size on iOS, as the header's actions, spaced to the 44pt pitch of a toolbar's items; a 22dp icon in Material's 48dp icon button on Android, which is the bar's height and the pitch there; the kit's small button on web) and puts the `secondary` ones behind a `Menu` labelled "More". A command that is `active` is drawn filled; `tone` draws the others in the label color, for a row of tools where the accent marks the active one, and `color` draws one in a color of its own; `hideLabel` keeps the icon alone; a command's `separator` draws a vertical `Divider` before it; a command with `items` is a `Menu` of its own, in the same host, filled while `active`. |
| Windows | With `commands` and no `field`, a WinUI `CommandBar` island: the control lays the commands out, moves the ones that do not fit into its own overflow menu, and draws labels beside the icons (`compact` drops them and leaves the naming to the overflow). A command with `items` is an `AppBarButton` with a `MenuFlyout`: a chevron on the bar, a submenu in the overflow. Otherwise a drawn bar of islands, where a command with `items` is the kit's `Menu`. |

Differences:

- A command marked `secondary` is in the overflow on every platform. Only
  Windows moves further commands there as the bar narrows.
- A `field` sends every platform to the drawn path: a text field is a React
  Native input and cannot live inside a `CommandBar`.
- `leading` and `trailing` are ignored when `commands` are given.
- Controls given as `leading` and `trailing` draw at the size the app gives
  them, spaced by `density`; the bar's metrics and pitch are the `commands`'
  alone, whatever the density.
- A command's `hideLabel` and `tone` are the drawn bar's. The Windows
  `CommandBar` decides its own labels (`density`) and takes no tone: a
  command is in the bar's own colors, a `destructive` one in the critical
  color.
- A command's `color` is every bar's: the drawn bars hand it to the kit's
  `Button` or `Menu`, over `tone` and `role`, so a tool is drawn in it and
  one that is `active` is filled with it. The Windows `CommandBar` draws
  the command's glyph and label in it, as it draws a `destructive` one in
  the critical color; a toggle that is on keeps the bar's own checked
  colors.
- A command with `active` is a toggle, on or off: drawn filled while on,
  and heard as one. The drawn bars give it the kit's `Button` with
  `pressed` (`aria-pressed` on web, the selected trait on iOS, Material's
  icon toggle button on Android); the Windows `CommandBar` makes it an
  `AppBarToggleButton`. In the kit's overflow menu (iOS, Android, web and
  a drawn Windows bar), a toggle that is on is an entry with the menu's
  check; a menu has no off state, so one that is off is a plain entry. The
  `CommandBar`'s own overflow keeps the `AppBarToggleButton`. A menu
  command that is `active` is the kit's `Menu` with `pressed` on the drawn
  bars, filled and heard the same way, for a tool whose menu picks what it
  does (a drawing bar's shapes tool); behind the kit's overflow its entries
  take its place whatever its state. The Windows `CommandBar` ignores
  `active` on a menu command, since an `AppBarButton` with a flyout has no
  checked state.
- A command's `separator` is a vertical `Divider` before it on the drawn
  bars, a rule in the overflow menu, and an `AppBarSeparator` in the
  Windows `CommandBar`. None is drawn before the first command of a row or
  of the overflow.
- A command with `items` is a menu, opened from the command, as `Tabs`
  `action` takes one; it takes no `onPress` or `role`. The kit's
  menus do not nest, so behind the overflow, on iOS, Android, web and a
  drawn Windows bar, its entries take its place, set off by rules, without
  the command's own label, and greyed out with it when it is `disabled`.
  The Windows `CommandBar` opens them as a submenu. On Windows, either bar
  binds the entries' `shortcut`s while it is mounted, and a `disabled`
  command binds none of them. A menu command with no entries is greyed out,
  since it would open on nothing. Behind the kit's overflow (iOS, Android,
  web and a drawn Windows bar) it puts nothing, and with nothing else
  behind it the bar draws no overflow menu. The Windows `CommandBar` keeps
  it as a greyed-out button wherever it goes, its own overflow included.

`fieldCommands` are the field's own: a find bar's previous and next, an
assistant's send. They share the trailing host with the overflow menu, and
they stay on the bar when it folds. A side with nothing to draw has no host,
and the field takes its room: a folded bar has no leading host, and one with
no field commands has a trailing host only while something is behind the
overflow. A host that empties keeps the size it last had on Android, so an
empty one would keep the field's room.
`foldCommands` folds the bar's `commands` behind its overflow menu while the
bar, measured, is narrower than 640 points, the kit's compact size class
(`COMPACT_WIDTH`, where `TabView` shows its switcher): an editor's status bar
gives its field the room while a find or assistant field is open on a phone.
The bar is measured from its first layout whether or not it folds, so
turning `foldCommands` on while the bar is narrow folds it at once. On
Windows the `CommandBar` is measured too, so the drawn bar that replaces it
when a field opens with the fold folds at once as well. Only a bar along an
edge folds: a `floating` bar, or one `at` a rectangle, is the width of its
controls.

A `floating` bar floats over the content rather than running along an edge:
raised and rounded, the width of its controls, as the strip of tools over a
selection or a block. On Android it is Material 3's
`HorizontalFloatingToolbar`; on iOS and web the kit's raised capsule holding
one native row; on Windows the same raised card around the `CommandBar`,
its labels left to the overflow.

`at` floats the bar over its parent beside a rectangle: lined up with it by
`align` (centred on it by default, from its left edge with `start`, or to
its right edge with `end`, for tools that hang from a block's corner; left
and right in the x coordinates of `at`, not leading and trailing), over it
unless there is no room (`preferredEdge` says which side to try first), and
kept inside the parent less `insets`. A right-to-left layout changes none of
this: React Native's layout reports x from the parent's left edge whatever
the direction, so `at` is in those coordinates, and the bar is placed in
them too, though React Native on iOS and Android swaps a view's `left` and
`right` there. The bar is laid over the parent
as an overlay that takes no presses but the bar's, is drawn only once it has
been measured and placed, and goes when `at` is `null`.

## FindBar

A bar to find text in what a screen shows: an editor, a document, a web
page. The finding itself is the app's, which hands back where it has got to.

Props: `value` and `onChangeText` (the text to find; left out, the bar keeps
its own), `placeholder` (`Find`), `matches` (`{current, total}`: drawn as "3
of 12", or "No matches" when there are none for the text, and nothing before
the app has looked), `onNext` (the next button, the keyboard's search key,
Enter), `onPrevious` (the previous button, Shift+Enter), `onClose` (the close
button, Escape), `autoFocus` (default true), `placement` (`top` by default),
`style`, `testID` (the field is `${testID}-field`).

Drawn on every platform as the kit's `Toolbar` with an inline field, the
count beside it, and previous, next and close as the field's commands in
the bar's one trailing host. Previous and next are disabled with no matches.
The count is a polite live region, so TalkBack and a browser's screen reader
hear it change. iOS has a system find bar, `UIFindInteraction`, but it
belongs to a `UITextView` or a `WKWebView`, which React Native content is
not, and no module the kit stands on reaches it.

## KeyboardBar

A bottom bar that sticks to the keyboard. It rides up by a transform, never a
resize, and reports the keyboard's height through `onKeyboard` so the content
above can pad or scroll by that much.

`onKeyboard` reports the keyboard's height alone. While the bar rides it
covers its own height above the keyboard as well, which `useKeyboardInset`
adds for a view the bar rides over, so an editor under the bar scrolls its
caret clear of the bar too (see
[the keyboard over a view](../services.md#the-keyboard-over-a-view)).

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
| Web | `@expo/ui`'s universal sections in the universal group's scroll view, recolored to the kit's tokens |
| Windows | The Settings app's layout, drawn: a body-strong heading over a card of rows divided by hairlines, with the note under it |

Differences:

- `titleUppercase` is ignored on iOS, where the `Form` decides the header
  case.
- A kit `ListItem` inside a section is rendered flush, since the section
  already insets its rows. A row that asks for `inset` explicitly keeps it.
- Rows outside a section are grouped into an implicit one, as a SwiftUI
  `Form` groups them. A section can be rendered by a component of the
  app's own, so a long form splits into components: the section tells the
  group it is one, and the group lays it out as a section rather than a row.
- Under a `Screen underBar` the form pads its content by the bar through
  `useScrollInsets()`. On iOS the `Form` is inset by the bar through its
  safe area, which follows a native search bar as it grows and collapses.
- Under `Tabs` with a floating `action` (Android, and iOS before 26) the
  form ends clear of the button: Android pads its content by
  `useScrollInsets().bottom`, and on iOS, where the `Form` takes no content
  padding, a clear row of that height ends it.

A `Sheet` full of one is how the kit does a form: the question is the
section's title and the note under it is the footer. In a sheet the form
pads by nothing for the screen's bar or the tab bar's action:
`useScrollInsets()` answers zero there.

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
before any `leading` content), `leading`, `trailing`, `supporting` (text
under the headline, its line breaks kept), `value` (text at the trailing edge
in the secondary color, before `trailing`: a setting's value, a file's size),
`badge` (`true` for a dot, a number for a count, as the kit's `Badge` at the
trailing edge), `badgeColor` (the badge's fill, a palette token such as `tint`
or any color React Native reads; a count on it is drawn in black or white,
whichever reads; without one, the `Badge`'s own red), `selected` (the current row, in the
selected fill and announced as selected), `action` (`label`, `onPress`, `disabled`, `loading`,
`role`, `variant` `text` or `filled`), `swipeActions` (`label`, `onPress`,
`icon`, `role`, `disabled` per action), `inset` (default true), `onPress`,
`testID`.

A row whose headline is a string is named from its slots on iOS, web and
Windows: "Essay, Edited, 2 KB, 3 new" for a headline, supporting text, value and
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
- On iOS a selected row in a `List` or a `FieldGroup` fills the whole row,
  through SwiftUI's row background.
- On iOS the `value` and the `badge` are one trailing fragment, which
  `@expo/ui` hosts in one view sized from its first child. The badge is the
  kit's `Badge` in SwiftUI there, so it measures itself after the value
  rather than taking the room the host offers.
- Without a `badgeColor` the badge on Windows is Fluent's critical red, the
  `InfoBadge`'s own fill, where the other three draw `destructive`.
- On Android TalkBack reads the row's own texts rather than a name composed
  from its slots, since `@expo/ui`'s Compose layer has no modifier that sets
  a description. The badge's words are among them as unseen text at the
  badge's end, so a count reads "3, new" and a dot "New". `selected` is announced
  on a row that presses by itself; an inert row, or one with
  `swipeActions`, shows the fill alone.
- On iOS and Android a row outside a host (a React Native `ScrollView` of
  rows) mounts a host of its own, so it draws there too. See
  [Native hosts](../hosts.md).

## List

A list of rows that grows: the inbox, the versions of a document, the
members of a space. The rows are `ListItem`s and the list is the platform's
own lazy one, which draws only the rows on screen. The web and Windows
render only the rows near the view; on iOS and Android React renders every
row and the native list keeps a view for each, so a very long list there is
better loaded a page at a time with `onEndReached`.

Props: `data`, `renderItem(item, index)`, `keyExtractor` (the index when
left out), `separators` (default true), `header`, `footer`, `empty` (what
shows in place of the rows when there are none, usually an `EmptyState`),
`onEndReached` (called once the last row has been drawn, for a list that
loads more), `estimatedItemHeight` (default 56: what the web counts a row
it has not drawn yet as; the other platforms measure their rows),
`contentInset` (`top`, `bottom`, `left`, `right`: the space inside the list
before the first row, after the last and at each side of the rows), `style`,
`testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `List` in the plain style: it recycles its rows, draws its own separators and scrolls under a translucent bar |
| Android | Compose `LazyColumn`, with a Material `HorizontalDivider` between the rows |
| Web | A DOM list that scrolls itself and draws only the rows near the view, with hairlines between them |
| Windows | React Native's `FlatList`, windowed, measuring its rows |

Differences:

- On iOS and Android a row is native content, as a row in a `FieldGroup`
  is: the kit's `ListItem`, or `@expo/ui` content. A React Native view
  inside a row is hosted a second time each time the list recycles it, so a
  row that needs one belongs in a `CardGrid`, which is drawn in React
  Native. The `header` and `footer` are native there too.
- Outside a host the list mounts one that fills the screen (`NativeHost
  fit="fill"`); under `Screen native` it uses the screen's.
- `empty` takes the list's place. On iOS and Android outside a host it is
  drawn in the list's own view with no host around it, so an `EmptyState`
  brings its own and fills the list; under `Screen native` it is native
  content in the screen's host, centred on Android. iOS and Android show it
  without the `header` and `footer`; the web and Windows keep them around
  it, and there an `EmptyState` fills the list's height between them, as
  in a `CardGrid`.
- Under a `Screen underBar` the list pads its first row by the bar through
  `useScrollInsets()`, with `contentInset` added to that. On iOS SwiftUI
  insets the list by a header the screen runs under through its safe area,
  following a native search bar, so the list adds only a `HeaderAccessory`
  floating under the header and `contentInset`.
- Under `Tabs` with a floating `action` (Android, and iOS before 26) the
  list ends clear of the button: it pads past its last row by
  `useScrollInsets().bottom`, with `contentInset` added. On iOS, where the
  `List` takes no content padding, a row of that height without a separator
  ends it. A SwiftUI `List` row is at least 44 points tall, so an inset
  under 44 points shows as a 44 point row there.
- `contentInset`'s `left` and `right` pad the rows' sides inside the
  scroller: the content padding of the `LazyColumn` on Android, of the
  `FlatList` on Windows and of the scroller on the web. On iOS they inset
  the `List` as a whole, its separators and its scroll indicator with the
  rows, since `@expo/ui` has no content margins for a scroll view.
- On Windows a tap on a row while a field has the touch keyboard goes to the
  row and leaves the keyboard up (`keyboardShouldPersistTaps="handled"`); a
  tap past the rows closes it.
- The list scrolls itself and fills the space its parent gives it, so a
  view wrapped around it needs `flex: 1`. On iOS, Android and Windows that
  parent needs a height of its own: inside a scroll view the iOS and
  Android list gets no height, and the Windows list grows to its rows, so
  it draws every one of them and is no longer windowed. On the
  web the list is its own scroller (`overflow-y: auto`, `flex: 1 1 auto`),
  so it scrolls under the fixed body that `ScrollViewStyleReset` sets, and
  in a parent with no height of its own (a scroll view of the app's own, a
  page that scrolls) it grows to its rows and the parent scrolls it;
  `style={{flexShrink: 0}}` does the same in a parent that has a height.
  Its padding by `useScrollInsets()` is inside the scroller, and so is its
  scroll padding, so a row the keyboard focus brings into view stops clear
  of the bar. Its box is its border box (`box-sizing: border-box`), so
  padding in `style` stays inside its full width. Its scrollbar spans the
  whole list, under the bar, since CSS cannot inset a scrollbar.
- On the web the list draws the rows inside the part of it the window
  shows, and a viewport more above and below. Two spacers keep the room of
  the other rows, at the height each row was measured at once drawn and at
  `estimatedItemHeight` before, and neither is a scroll anchor, so the drawn
  rows hold still while a spacer changes. Each row says where it stands in
  the whole (`aria-posinset`, `aria-setsize`). `onEndReached` fires once the
  list is laid out and the window draws the last row, and again when more
  rows arrive while it is still drawn, so a list that loads more fills the
  view; a hidden list reports no end. Safari has no scroll anchoring, so
  there a scroll up into rows never drawn can move what shows by the
  difference between their height and the estimate. A row scrolled out of
  the window is removed, as a native lazy list removes it, and the focus
  with it. Only the rows drawn are in the page: the browser's find in page,
  printing, a screen reader's browse mode, and a link or a script that
  scrolls to a row's element reach only those. A static page, and a test
  renderer that lays nothing out, hold only the rows that fill 1200 pixels
  at `estimatedItemHeight`.

## CardGrid

A grid of cards that grows: the documents of a workspace, the photos of a
drop, the spaces on a dashboard. The columns come from the width: as many
cards of at least `minItemWidth` as fit, up to `maxColumns`, so a phone
holds two and a desk four without the app measuring anything.

Props: `data`, `renderItem(item, index)` (one cell, usually a `Card`, which
fills the cell's width), `keyExtractor`, `minItemWidth` (default 150),
`maxColumns` (default 4; a fraction counts down to a whole number and
anything under 1 is 1), `gap` (default 12, on both axes), `header`,
`footer`, `empty`, `onEndReached`, `estimatedItemHeight` (default 180: what
the web counts a row of cells it has not drawn yet as; the `FlatList`
measures its rows), `contentInset` (`top`, `bottom`, `left`, `right`: the
space inside the grid before the first row, after the last and at each side
of the cells), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Windows | React Native's `FlatList` of rows, windowed, measuring its rows, with the column count worked out from the measured width; a short last row keeps its cells the width of the others |
| Web | A CSS grid that scrolls itself and draws only the rows of cells near the view |

Differences:

- Drawn in React Native on every platform, like `Card`, because a card
  holds what is not native: a preview, a thumbnail. A list of rows is
  `List`.
- On iOS, Android and Windows a width that changes the column count (a
  rotation, a split view resized) cuts the rows again in the same list, so
  the scroll position survives the resize.
- Under a `Screen underBar` the grid pads its first row by the bar through
  `useScrollInsets()`, and on iOS its scroll indicators with it. Under an
  iOS header the screen runs under, the grid takes UIKit's own inset
  (`contentInsetAdjustmentBehavior="automatic"`), which follows a native
  search bar, and pads only for a `HeaderAccessory` floating under the
  header and `contentInset`.
- Under `Tabs` with a floating `action` (Android, and iOS before 26) the
  grid ends clear of the button: it pads past its last row by
  `useScrollInsets().bottom`, with `contentInset` added, and on iOS its
  scroll indicators with it.
- `contentInset`'s `left` and `right` pad the cells' sides inside the
  scroller, and the columns are counted from the width between them: on iOS,
  Android and Windows the measured width less the two, and on the web the
  content box the grid measures, which leaves the padding out.
- On iOS, Android and Windows a tap on a card while a React Native field has
  the keyboard goes to the card and leaves the keyboard up
  (`keyboardShouldPersistTaps="handled"`); a tap between the cards closes
  it.
- An `empty` fills the grid's height under the header, as an `EmptyState`
  centres itself in the room it is given.
- The grid scrolls itself and fills the space its parent gives it, so a
  view wrapped around it needs `flex: 1`. On iOS, Android and Windows that
  parent needs a height of its own: inside a scroll view the grid grows to
  its rows, so it draws every one of them and is no longer windowed. On the
  web the grid is its own scroller (`overflow-y: auto`, `flex: 1 1 auto`),
  so it scrolls under the fixed body that `ScrollViewStyleReset` sets, and
  in a parent with no height of its own (a scroll view of the app's own, a
  page that scrolls) it grows to its cells and the parent scrolls it;
  `style={{flexShrink: 0}}` does the same in a parent that has a height.
  Its padding by `useScrollInsets()` is inside the scroller, and so is its
  scroll padding, but its scrollbar spans the whole grid, under the bar,
  since CSS cannot inset a scrollbar. Its box is its border box
  (`box-sizing: border-box`), so padding in `style` stays inside its full
  width.
- On the web the grid draws the rows of cells inside the part of it the
  window shows, and a viewport more above and below, with two spacers for
  the room of the other rows, as the `List` does. Once its width is
  measured it counts the columns the way the native grid does and writes
  them into the grid, so a row of cells it draws is one row of the grid;
  until then (a static page, the first paint) the stylesheet counts the
  same columns. Each cell says where it stands in the whole
  (`aria-posinset`, `aria-setsize`), and `onEndReached` fires as the
  `List`'s does: once the grid is laid out and the window draws the last
  row, and again when more cards arrive while it is still drawn. As with
  the `List`, a row of cards scrolled out of the window is removed, and the
  focus with it. Only the cards drawn are in the page, for find in page,
  printing, a screen reader's browse mode and a scroll to a card's
  element, and a static page holds only the rows that fill 1200 pixels at
  `estimatedItemHeight`.

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

Inside a host (a `Toolbar`'s row, a `NativeHost`), a vertical rule on iOS is
as tall as the SwiftUI row it is in. On Android it is 24dp, Material's icon
size, with any `inset` taken from that: Compose's rule fills the height it
is given, and inside a host there is no row height to give it.

## EmptyState

What a screen shows when it has nothing to show: no drops yet, no results, no
connection. Props: `title`, `description`, `icon`, `action`, `loading`,
`selectable`, `style`, `testID`.

`action` is the one thing to do about it, as data: `label`, `onPress`,
`variant` (`filled` by default), `icon`, `disabled`, `loading`. The kit draws
it as its own `Button` inside the platform's view, so natively the action is
native beside native text rather than a React Native hop between the two. A
node of the app's own is React Native content instead: on Android, and on iOS
inside a host, it rides in the view as hosted React Native content, where the
kit's controls mount hosts of their own; on iOS outside a host it is drawn
below the view, and the web and Windows draw it under the description.
`loading` puts the platform's spinner in the icon's place, so a screen waiting
for its record is the same empty state as one that has none. The description
wraps at the screen's width and can be selected and copied, unless
`selectable` is off.

On iOS and Android, outside a host the state mounts one as wide as its
container, and `style` and `testID` go on the view around it. Inside one (a
`Screen native`, a `NativeHost`, a hosted `List`'s `empty`, or a `Sheet`'s
bar, accessory or body without `maxHeight`) it renders bare: `testID` names
the native stack and `style` is not applied. A `Sheet`'s capped body and its
footer are React Native content, so a state there mounts its own host. A
bare state is as wide as its container and centres itself and its action as
one group in the height the container gives it, the whole screen under a
`Screen native`. On iOS it fills whatever space it is offered; on Android,
where the container leaves the height open, it is as tall as itself and the
container places it. See [Native hosts](../hosts.md).

| Platform | Renders |
| --- | --- |
| iOS 17 and later | The system's `ContentUnavailableView` and the action in one host that fills the width. While `loading` the same layout is composed in SwiftUI, padded by SwiftUI's standard inset, as wide as the system view and at its own height, with a large `ProgressView` in the symbol's 48 point slot. |
| Older iOS | The same layout composed in SwiftUI, with the symbol as an SF Symbol image and the `ProgressView` while loading |
| Web | A drawn column with the kit's `Icon`, the kit's `Spinner` while loading |
| Android | A Compose column in one host: the token's drawable, the title and the description in the Material scale, the `CircularProgressIndicator` while loading, and the action as the Material button. A node of the app's own rides in the column as hosted React Native content. While `selectable`, the description is React Native text hosted in the column too, since `@expo/ui`'s Compose layer has no selection container. |
| Windows | The drawn column with a Segoe glyph, the WinUI `ProgressRing` while loading |

The drawn layout (web, Windows) is one accessibility element that reads the
title and the description together. The SwiftUI layout composed on older iOS
and while loading, and the Compose column, read them as the separate texts
they are; `@expo/ui`'s Compose layer sets no description on a column.
