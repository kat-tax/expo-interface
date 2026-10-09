# Navigation

[Docs home](../README.md)

Stacks, tabs, pagers and header controls, built on Expo Router.

Everything is exported from `expo-interface`. Each entry says what the component
does, which props it takes, what each platform renders, and where the platforms
differ. [All components](README.md) lists the other groups.

## Stack

`Stack` is Expo Router's native stack on iOS, Android and web. On Windows,
where `react-native-screens` draws nothing, it is a stack of the kit's own on
Expo Router's stack router, so `router.push`, `Link` and `Stack.Screen`
options work the same. An app that uses the kit's `Stack` in its layouts has a
Windows build with no other change.

On Windows the stack draws its header (`title`, `headerTitle` as text or a
node, `headerLeft`, `headerRight`, `headerBackVisible`, `headerShown`). Its
motion is the WinUI `Frame`'s, key frame for key frame. A push plays drill
in: the screen it covers grows to 104% and fades over 100 ms while the new
one settles from 94% over 783 ms, fading in over 333 ms; a pop plays the
reverse, the closer screen shrinking to 96% over 100 ms while the one
returning settles from 106% over 333 ms. `animation` is read in the native
stack's words. `fade_from_bottom` is page refresh: the old screen fades
over 150 ms, then the new one appears and rises 140 points over 300 ms.
`slide_from_right`, `slide_from_left`, `ios_from_right`, `ios_from_left` and
`simple_push` are the horizontal slide: the old screen moves 150 points on
over 150 ms and goes, then the new one comes 200 points in from the other
side over 300 ms. `slide_from_bottom` waits 250 ms, then rises 200 points
over 350 ms while the old screen sinks. `fade` and `flip` are page refresh
without the rise, and `none` is at once. The fades run on the compositor.
Drill in, the slides and page refresh run on the JavaScript thread:
react-native-windows 0.84 does not animate a translation natively, and a
scale it animates natively is multiplied onto the scale the style already
holds, so a screen would stay at the drill's first frame, drawn smaller than
it is laid out. Both are react-native-windows' to fix, and issues for them
should be filed upstream.
The screen leaving keeps its state until it is gone. A screen with
`presentation: 'modal'` (or `formSheet`, `containedModal`, `fullScreenModal`)
is a card over smoke above the screen below, the way a WinUI dialog is
arranged, and a `transparentModal` lies over the window as it is. Escape, the
smoke and the back button dismiss a modal; Alt+Left, the keyboard's back key
and the mouse's back button pop the stack. With `expo-windows` the window's
title follows the focused screen ("Settings – My App").

A route that holds `Tabs` is the window's frame, as a WinUI `NavigationView`
is: a card pushed over it is drawn inside the tabs' content with the pane
still there, and the pane's own back button pops it. Under a pane a header
row draws no back button of its own, since the pane's is the platform's;
`headerLeft` is still told there is somewhere to go back to. A modal keeps
its dismiss. With the tabs hidden there is no frame, and a card replaces
them with a drawn back button, as it does with no tabs at all.

The layout below is the usual one, and on Windows it gives the pane, the
drill-in and the back button with nothing added:

```tsx
// app/_layout.tsx
<Stack screenOptions={{headerShown: false}}/>
// app/(tabs)/_layout.tsx
<Tabs routes={routes}/>
// app/[id]/_layout.tsx: pushed over the tabs
<Stack/>
```

## Tabs

The app's section tabs for Expo Router.

Props: `routes` (`name`, `href`, `label`, `icon` as one of the app's
`IconToken`s or the symbol names per platform, `badge`, `windowsPlacement`),
`hidden` (or a function of the route, `({pathname, segments}) => boolean`),
`action` (the app's one action beside its tabs: `label`, `icon`,
and `onPress` or menu `items`), `badgeMax` (a count above it is drawn as
`99+`; 99 by default), and per platform: `webLogo` (`icon-only`, `text-only`,
`icon-and-text` or a node), `webIcon` (an image, or an `IconToken` drawn as
the kit's glyph in the label color), `webTintIcon` (an image `webIcon` drawn
in the label color too, through a CSS mask: the image must be one the page
may load as a mask, from the same origin or served with CORS, or the mark
is not drawn, and an image with no `uri` is drawn as it is), `webActions`,
`webActionsPlacement`, `webFoldHeader`, `webMaterial` (`none`, `thin`,
`regular`, `thick`), `windowsPane` (`top`, `left`, `compact`, `minimal`,
`auto`).

| Platform | Renders |
| --- | --- |
| iOS, Android | Expo Router's native tabs: the platform's own tab bar at the bottom, with `badge` as the bar's badge. On iOS 26 the `action` is a button or a menu in the tab bar's bottom accessory, its icon alone while the accessory is inline in a minimized bar. On Android and on iOS before 26 it is a floating action button above the tab bar at the bottom trailing corner, over every tab's screens, and a `Screen`'s own `fab` sits above it. A `Screen` counts the floating action in `useScrollInsets().bottom`, so the kit's `List`, `CardGrid`, `FieldGroup` and [`ScreenScrollView`](layout.md#screenscrollview) end clear of it. The app's toast (`ToastProvider` around the tabs) stands above the bar, and above its accessory on iOS 26, and the floating action lifts above the toast while it shows. The `action` goes with the tabs while they are hidden, from the accessory as from above the bar. |
| Web | A floating bar along the top with the app's logo, the tabs and action slots. A route's `badge` is a pill beside the label. In a window too narrow for the row, a phone's width, the tabs show their icons alone with their names as accessible names, and a `HeaderMenu` or `HeaderAction` in the bar with an icon shows that alone. A folded header's `HeaderSearch` is a frameless field beside the logo, after the app's name or a pushed screen's title, that takes the bar's spare width and shrinks with the bar; in a narrow bar it takes the name's room beside the mark. An `action` placement is a magnifier among the actions, and `stacked` a second pill under the bar. The tabs' own `action` is a `HeaderAction`, or a `HeaderMenu` with `items`, among the bar's actions after whatever a screen folds in, and goes with the tabs while they are hidden. The row clips what it cannot hold, so the page never scrolls sideways. |
| Windows | A WinUI `NavigationView` in any of its pane display modes: the top bar (`top`), or with `windowsPane` the navigation pane down the left side, expanded (`left`), at its glyph-only width (`compact`), or as its toggle button alone (`minimal`); `auto` picks by the window's width at WinUI's own breakpoints, the expanded pane from 1008 points, the compact one from 641 and the minimal one below that. The expanded pane's toggle button collapses it to its glyphs beside the content and back. The compact pane's opens the pane over the content, and so does the minimal pane's, which is drawn at the top start of the content with the screen's header beside it; a selection, a press beside the open pane or Escape closes it. A count `badge` is an `InfoBadge`; other text is its dot. The `InfoBadge` holds a number alone, so a count past `badgeMax` is drawn as the cap. The `action` is the first item, invoked rather than selected, and with `items` it opens a `MenuFlyout`. `windowsPlacement` puts a route at the pane's foot (`footer`) or makes it WinUI's own settings item (`settings`). The control's own back button, at the top of the pane or the start of the top bar, pops a card the stack above pushed over the tabs, or a screen a stack inside a tab pushed; a selection in the pane leaves the drilled-in screens. The button is drawn whenever a stack is around the tabs, disabled at the root as a WinUI app's is, and only while something can pop when the tabs are the root. A press on the selected item returns to its root, as the Settings app does. A selection slides the content along the top bar in the order of the items, or refreshes it in a side pane; back from a card, the content returns as the card leaves. |

On web a screen under `Tabs` has one bar, not two: `ConstrainedStackHeader`
hands its header to the bar and draws nothing itself. A pushed screen hands
over all of it (the back button in the mark's place, the title where the
app's name goes, `headerRight` where `webActions` go); the back button is the
kit's `Icon`, drawn from the font the app registers ([The web
font](../icons.md#the-web-font)). A tab's own screen
hands over `headerRight` alone and keeps its title, since the tab beside it in
the bar already says it. The bar keeps the height of its tabs, and a header
control folded into it drops to their size. `hidden` hides the tabs and the
`action` rather than the bar while a pushed screen's header is folded in;
`webFoldHeader={false}` keeps the two rows. A screen reached with nothing
under it, a deep link to a screen other than its stack's `index`, has no
back button: the bar folds in its title all the same and puts the logo in
the back button's place, a link to the first tab named for it (the app's
name stands in for a mark the logo does not have).

Natively such a screen has no back button either, and with the tabs hidden
nothing on it leads home. Export `unstable_settings = {anchor: 'index'}`
from the tab's stack layout (`app/(tabs)/home/_layout.tsx`): a deep link
then opens the stack with its index under the screen, and the platform's
back button leads there. On web the bar then shows that back button in
place of the home link.

`hidden` as a function of the route decides on every render, by the path or
the segments, so the tabs go on the routes it names and come back on the
others. A static export answers it too, and writes a page its route hides
without the tabs. On a pushed screen that page has no bar until it runs,
since the screen's header folds into the bar once the screen is mounted.

```tsx
<Tabs routes={routes} hidden={({segments}) => segments.at(-1) === '[id]'}/>
```

A screen hides the tabs for itself by rendering `HideTabs` in its content:
the tabs go while the screen is focused and come back when it loses the
focus or goes, as `hidden` would hide them, decided by the screen rather than
by the URL. `<HideTabs hidden={false}/>` lets go without unmounting. It acts
once the screen is mounted, so a static export draws the tabs on its page
until the page runs; a page its URL decides is `hidden` as a function of the
route.

```tsx
export default function Document() {
  return (
    <Screen>
      <HideTabs/>
      <Editor/>
    </Screen>
  );
}
```

On web the bar is a `navigation` landmark of links, not a `tablist`, since the
tabs move between routes rather than panels; the active one carries
`aria-current="page"`, and a pushed screen's title is the page's `h1`.

`webMaterial` draws the bar as one of the kit's materials, the ones `Sheet`
takes: its fill thinned over a blur of what scrolls under it, a hairline in
the separator color at its edge and a soft shadow, so the web reads as the
same app as iOS, whose bars are glass. The bar is solid where the browser has
no `backdrop-filter`, under a reduced-transparency setting and in forced
colors. `regular` and `thick` keep the labels legible over any content in
both schemes; `thin` lets more through than that in the dark scheme, so use
it over the app's own background. A screen's content passes under the bar
only on a `Screen underBar`, whose scroll content pads its top by
`useScrollInsets()` (the kit's `List` and `CardGrid` do so themselves, and
an app's own scroll view is a [`ScreenScrollView`](layout.md#screenscrollview));
otherwise the bar sits over the screen's background alone.

The Windows pane width is measured rather than read from the window, since
react-native-windows reports no dimension change when the window is resized.

## TabStack

The stack inside a tab, with the platform's header over the tab's screens.
Props: `title`, `headerRight`, `material`. On web its header is
`ConstrainedStackHeader`; on Windows it is the kit's `Stack`.

`headerRight` returns the root screen's header controls: a `HeaderMenu`, a
`HeaderAction`, or several in a `HeaderActions`. On iOS and Android they
become the bar's own items, read off the elements returned and declared with
the index screen the way Expo Router takes a `Stack.Toolbar` inside a
`Stack.Screen`, so the stack never holds a React Native view in a native bar.
Return the kit's elements themselves: a component of the app's own around
them is placed in the bar as a custom view, since its items cannot be read
without rendering it, and the controls inside it draw themselves there, in a
host. On web and Windows the drawn header row takes them in its trailing
slot.

`material` draws the header as one of the kit's materials, the ones `Sheet`
takes (`thin`, `regular`, `thick`), with the screens running under it: on
iOS the system's material behind a translucent bar. A `Screen` under it
leaves the header's height clear at the top, and one that is `underBar` lets
its content pass under the bar, padding that content by `useScrollInsets()`,
as it does under the web tab bar's material. Android has no bar material of
its own, and its bar's items and menus take the header's colour (Expo Router
paints its icon buttons and the dropdown's surface with it), so its header
stays the bar's opaque fill with the screens below it, whatever `material`
says. On web the header folds into the bar, which has `Tabs webMaterial`; a
drawn web header stays opaque, and so does Windows'.

## ConstrainedStackHeader

The web stack header: a row that matches the content's maximum width, or,
under a `Tabs` bar with `webFoldHeader`, nothing at all, since the bar carries
the header. On the other platforms it renders nothing and the native stack's
header is used.

## TabView

Document tabs: a strip of things the user opened and can close, with the
selected one's content under it. These are not the tabs `Tabs` draws.

Props: `tabs` (`id`, `title`, `label`, `icon`, `pinned`, `menu`, `depth`,
`accessory`), `selected`, `onSelect`,
`onClose` (leaving it out takes the crosses away), `onAdd` (leaving it out
takes the add button away), `addLabel` (what the add button is called to a
screen reader and in Windows' tooltip; "New tab", except on the WinUI strip,
which keeps WinUI's own words, in the system's language; words given once
stay there if `addLabel` is later left out), `children` (the selected
tab's content; left out, the tabs alone), `content` (whether there is a page
under the tabs, whatever `children` are), `label` ("Tabs"), `layout`
(`auto`, `strip`, `switcher`), `fill` (`element`, the default, or `none`),
`style`, `testID`.
`nextSelection(tabs, closing, selected)` is exported for a caller that closes
the open tab: it moves to the next tab, or the previous one when the last was
closed.

With no `children` at all the view is the tabs alone: as tall as the strip
or the switcher's bar rather than growing into its parent, and on web with
no `tabpanel` for the tabs to control. That is the shape for a strip in a
`HeaderAccessory`, whose pages are the screen's content. The switcher's
cards, with no page to take the place of, then open under its bar and make
the view taller, at most half the window, and scroll past that: in a
`HeaderAccessory` they push the screen's content down, or lie over it under
a header the screens run under. Children written
but rendering nothing, `null` or the `undefined` of `{current && <Editor/>}`,
are a page with nothing in it, so a view whose last document closes keeps
its size. `content` says it outright: `false` is the tabs alone, and draws
no `children`; `true` is a page, empty without them. A component that wraps
a `TabView` as `<TabView {...rest}>{children}</TabView>` always passes
`children`, if only as `undefined`, so a strip through it takes
`content={false}`.

| Platform | Strip (640 points and wider) | Switcher (narrower) |
| --- | --- | --- |
| iOS, Android | A drawn strip with a real close button beside each tab | A count button that opens a grid of cards |
| Web | A drawn strip in the APG tab pattern | The same grid |
| Windows | A WinUI `TabView`, the strip alone: the items carry no content, and the page is drawn underneath by React Native | The same grid, with Segoe glyphs |

Differences:

- Below 640 points no platform draws a strip. This is what Safari and Chrome
  do on a phone, 640 is both WinUI's compact breakpoint and Android's medium
  window class, and it is measured rather than read from the window, since a
  pane beside the tabs changes the room they have.
- On web the close cross is a pointer affordance, not a control: ARIA makes
  everything inside a `tab` presentational and allows no button among a
  `tablist`'s children. The keyboard closes a tab with Delete, which each
  closable tab announces through `aria-keyshortcuts`. Arrow keys move and
  select at once. iOS and Android keep a real button that VoiceOver and
  TalkBack reach; Windows has the control's own cross.
- Reordering is off on Windows. A drag would move the tab in the control
  while the kit's array stayed as it was, so the control is told not to offer
  it.
- The cards are a title, an icon and a cross, not live previews.
- A tab's `menu` (rename, duplicate, close others) opens with the gesture
  the platform uses for a context menu: a long press on iOS and Android, a
  right click or the Menu key on web and Windows, and on web a touch held
  for half a second as well, since Safari on iOS raises no context menu
  event for a touch. It is the kit's `PopupMenu`, under the tab on iOS and
  Android and at the pointer on web and Windows, and one popup serves the
  whole strip. On web the tab says it has one through `aria-haspopup`.
- `depth` indents a tab by 12 points a level, on every strip and on the
  cards, for documents that belong to one another.
- `fill="none"` paints nothing behind the strip or the switcher's bar, for
  tabs on a material that a fill of their own would cover, and marks the
  open tab with a pill in the palette's pill fill. The WinUI strip is an
  island, which cannot be see-through, so on Windows it is painted in the
  screen's background, the fill of the header row it sits in there.
- `accessory` (a presence dot, a count, an unsaved mark) is drawn after the
  title on the strips the kit draws and on the switcher's cards. The WinUI
  strip holds text and a glyph alone, so on Windows it shows on the cards
  only. A screen reader does not read it: it reads a tab's `label`, which
  defaults to the title, on every platform, the WinUI strip included. Say
  what the accessory means there ("index.tsx, Ana is here"), starting with
  the title so a voice command still finds the tab by what it shows.

## Pager

A row of full-width pages that snaps to one at a time, with an indicator.
Props: `page`, `onPageChange`, `children` (one per page), `indicator`
(default true; never shown for one page), `label`, `style`, `testID`.

| Platform | Scroller | Indicator |
| --- | --- | --- |
| iOS | `UIScrollView` paging | Drawn dots |
| Android | A snapping scroll view | Drawn dots |
| Web | `scroll-snap-type: x mandatory` | A drawn tab list with arrow keys |
| Windows | The composition scroller's snap points | A WinUI `PipsPager`, with the chevrons Fluent shows under the pointer |

The scroller is React Native's own paging on every platform. The native
indicators are not reachable (`UIPageControl` is not wrapped, Material's is
not exposed), and a `PipsPager` fits because it has no children. A swipe
reports the page it lands on and nothing more; if `page` does not follow, the
view stays where the finger left it. On web the off-screen pages are `inert`,
so nothing hidden can take focus.

## HeaderMenu, HeaderAction, HeaderActions

The controls of a stack header's trailing slot. `HeaderMenu` is a menu
behind a trigger at the platform's header size; `HeaderAction` is the same
trigger with a press instead of a menu; `HeaderActions` holds several, in the
order given.

A header control is rendered in the screen's content, beside the screen's
own views, and sends itself to the header from there:

```tsx
export default function Document() {
  return (
    <>
      <HeaderActions>
        <HeaderAction label="Share" icon={icon.share} hideLabel tone="label" onPress={share}/>
        <HeaderMenu label="Export" icon={icon.export} hideLabel tone="label" items={exports}/>
      </HeaderActions>
      <Screen>...</Screen>
    </>
  );
}
```

For a tab's root screen, `TabStack headerRight` takes the same elements. A
stack's `headerRight` option is not where they go: natively that slot holds
a React Native view, and these are the bar's own items.

| Platform | Renders |
| --- | --- |
| iOS | The navigation bar's own button items, through Expo Router's `Stack.Toolbar`: an action is a bar button with its SF Symbol (or its label, when the label shows), a menu a bar button with a `UIMenu` of the entries, in the bar's own size and spacing. A `tone` of `label` draws the item in the header's text color, the default in the accent. |
| Android | The top app bar's icon buttons, with the label as the accessible name, and a menu's entries in a Material dropdown; an entry that is `active` has a trailing check, a `destructive` one the danger color, and a `separator` starts a group under a rule. A control without an Android drawable in its icon is drawn as the kit's own text button, in a host. |
| Web | The kit's text button or `Menu` trigger at the header's size in the drawn header row, or at the tab bar's size in the bar a header folds into, where a control with an icon shows that alone when the bar is too narrow for labels. `HeaderActions` is a flex row with a gap. |
| Windows | The same triggers as islands, in the header row the kit's stack draws; `HeaderActions` is a plain view of them. |

Rendered inside a header already (a custom header's trailing slot, the web
tab bar), a control draws itself there. Natively a `HeaderActions` takes
`HeaderAction` and `HeaderMenu` elements directly: the bar's items are read
off them, and a component of the app's own between the row and its items
cannot be. Such a component is a custom view in the bar, and the controls it
renders draw themselves inside it, each in a host of its own. `testID` names
the web and Windows triggers; the native items are found by their `label`.
A native bar's menu draws no `swatch` dot for an entry: the kit gives the
bar's menu actions none.

## HeaderSearch

The header's search, in the placements the platforms have. Like the other
header controls it is rendered in the screen's content and sends itself to
the header from there; mounting it adds the search and unmounting it takes
the search away. A screen has one search: on web and Windows two in one
screen share the route's one `headerSearch` option, and the first to unmount
takes the search away.

```tsx
export default function Documents() {
  return (
    <>
      <HeaderSearch placement="stacked" placeholder="Search documents" onChangeText={setQuery} onSubmit={search}/>
      <Screen>...</Screen>
    </>
  );
}
```

Props: `placement` (`automatic`, `stacked`, `integrated`, `action`,
`inline`), `placeholder` (a string, or a function of the search's state),
`autoFocus`, `autoCapitalize`, `inputType` (the
keyboard Android's field opens with: `text`, `phone`, `number`, `email`),
`hideWhenScrolling` (iOS `stacked`: the field collapses as the content
scrolls, default true), `integration` (`field`, `button`, `centered`, iOS
26's three integrated looks), `onChangeText`, `onSubmit` (the search key or
button), `onOpen` and `onClose`, `onFocus`, `onBlur`, `testID`, and a `ref`
with `focus`, `blur`, `setText`, `clear` and `cancel`.

No native search field is controlled, so there is no `value`: the text is
read through `onChangeText` and set through the `ref`, and a change made
through the `ref` is not reported, as the platforms' own commands are not.
The colors are the palette's: the accent for the cursor and iOS's cancel,
the label color for the text and Android's icons, the tertiary label color
for Android's hint. `onOpen` and `onClose` report an `action` expanding and
collapsing, a field taking and giving up the focus (iOS's controller, the
drawn fields), and Android's `SearchView` opening and closing.

When the search goes (its screen unmounts, or the app stops rendering it),
`onChangeText` is called with an empty query, so whatever it filtered is
whole again without the app clearing it by hand.

A `placeholder` function is called with the search's state, `{size}`:
`short` while the web bar is too narrow for its labels and its inline field
is at its floor, `full` everywhere else, the native placements included. It
is how a search says less where it has less room, without the app measuring
the bar:

```tsx
<HeaderSearch
  placeholder={state => (state.size === 'short' ? 'Search docs' : 'Search documents')}
  onChangeText={setQuery}
/>
```

The field's accessible name is always the answer for `{size: 'full'}`, so
the short text never becomes its name.

| `placement` | iOS | Android | Web | Windows |
| --- | --- | --- | --- | --- |
| `stacked` | Native: `UISearchController` under the title, collapsing as the content scrolls (`hideWhenScrolling`) | Drawn: a row under the app bar in the header's fill with its hairline, the `SearchField` box the width of the content | Drawn: a row under the header row at the content's width, in the header's fill. Under a `Tabs` bar that folds the header, a second pill under the bar, in the bar's material, which the screens pay for through `useTabBarInset()`. | Drawn: the same row, with the `AutoSuggestBox` |
| `integrated` | Native on iOS 26: the bottom toolbar's search, as a field, a button or centred (`integration`); on iOS 16 to 18 UIKit's own fallback, `inline` | Drawn: a bottom `Toolbar` with the field in its field slot | The same | The same, with the `AutoSuggestBox` |
| `action` | Native on iOS 26: the bar's own search button, which expands into the field and stays in the navigation bar rather than the toolbar; on iOS 16 to 18 UIKit's own fallback, `inline` | Native: the toolbar's `SearchView`, a magnifier among the actions that opens across the bar and is iconified again on close | Drawn: a magnifier among the header's controls that expands into a field across the row and takes the focus; the title goes while it is open. It collapses on Escape, through `cancel`, or when it loses the focus with nothing in it. | The same, with the `AutoSuggestBox` |
| `inline` | Native on iOS 16 to 18: a field beside the title; on iOS 26 UIKit's own fallback | Drawn as the `SearchView` open from the start, and opened again when it is closed: the one open form the toolbar has | Drawn: a frameless field after the title, the placeholder on the header's own fill with no glyph and no box of its own: the placeholder is the affordance. Focus is the caret and the typed text, with no ring; a focus from the keyboard draws a hairline under the field in the tint. It takes the row's spare width up to a desktop search box's and shrinks with the row to a short field, so it stays in the row at every width. Under a `Tabs` bar that folds the header, beside the logo. | Drawn: the `AutoSuggestBox` in the header row beside the title |
| `automatic` | Native: the system's choice | `action` | `inline` | `inline` |

The drawn placements are drawn with what the kit has: `SearchField`'s box at
the header's metrics for the rows and the bottom bar, with its focus ring,
since there a frame belongs; a frameless field for the web's `inline` (the
header is its frame); a `HeaderAction` for the magnifier; `Toolbar` for the bottom bar, the header's fill and material, and
the same events and commands as the native search, so an app writes one
search and reads one table.

The row Android draws for `stacked` and the bar every drawn platform draws for
`integrated` are the `Screen`'s when the search is rendered inside one: the
row above the content, the bar below it with the `Fab` lifted above it.
Outside a `Screen` they are drawn where the element is, the bar over the
bottom edge of the view it is in.

A `HeaderActions` beside it keeps its items: the search is the header's own
search, not one of its items. Natively a `HeaderSearch` inside a
`HeaderActions` is lifted out and sent beside the row. It is not what
`TabStack headerRight` takes: render it in the screen's content.

Differences:

- `hideWhenScrolling` and `integration` are iOS's; the drawn rows stay where
  they are. `inputType` is Android's. `autoCapitalize` is not applied on
  Windows.
- On iOS the native stack draws the bar translucent while a search is set,
  and UIKit insets a scroll view under it; content that is not a scroll
  view starts under the bar.
- On Windows `focus` and `blur` through the `ref` ask the `AutoSuggestBox`'s
  island for the focus through react-native-windows' focus command.

## HeaderAccessory

A row of the screen's own under its header: a strip of document tabs, a
filter bar, a breadcrumb. Render it in the screen's content, as a
`HeaderSearch` is, and the header takes it. The row lays out its own height.

```tsx
<Screen underBar>
  <HeaderAccessory>
    <TabView tabs={open} selected={current} onSelect={setCurrent} fill="none"/>
  </HeaderAccessory>
  <List data={rows} renderItem={renderRow}/>
</Screen>
```

A `TabView` without `children` is the strip alone; the page is the screen's
content. `fill="none"` lets the header's material show through the strip.

Unmounting it takes the row away, as unmounting a `HeaderSearch` takes the
search away. On web and Windows the row is the route's one `headerAccessory`
option, so a screen renders one: two in one screen share it, and the first
to unmount takes the row away.

Content passing under a bar pays for the row through `useTabBarInset()`, as
it pays for the bar, so a `Screen underBar` with the kit's `List` or
`CardGrid` starts its first row clear of both.

| Platform | Draws |
| --- | --- |
| iOS | The row is the `Screen`'s, at its top. Under a header the screens run under (a `TabStack` with a `material`), it floats at the header's bottom edge in the header's material, and its height is added to `useTabBarInset()`. Under an opaque header it sits above the content, across the screen, with the content right under it. |
| Android | The row above the content, across the screen, under the app bar, which is opaque. |
| Web | Under the header's row, in the header's fill. Under a `Tabs` bar that folds the header, a pill under the bar (and under a stacked search), in the bar's material, measured, and added to `useTabBarInset()`. |
| Windows | Under the header's row, in the header's fill, clear of the caption buttons in the title bar. |

Outside a `Screen` on iOS and Android the row is drawn where the element
is.

## ExternalLink

A link to a URL outside the app.

| Platform | Opens in |
| --- | --- |
| iOS, Android | The in-app browser (`expo-web-browser`) |
| Web | A new tab |
| Windows | The default browser, through `Linking`. There is no in-app browser, and `expo-web-browser` has no Windows module. |

## ShareLink

A button that hands something to the platform's share sheet. Props: `label`,
`url`, `message`, `title` (what the sheet calls it; defaults to `label`),
`icon`, `onShare` (called once the sheet has been asked for, with whether the
platform could open one), and the `Button` props `variant`, `size`, `shape`,
`tone`, `color`, `disabled`, `hideLabel`.

| Platform | How |
| --- | --- |
| iOS | SwiftUI's own `ShareLink`, with the kit's `Button` as its label. The control presents the sheet itself. |
| Android | React Native's `Share`, an `ACTION_SEND` intent |
| Web | React Native's `Share` through `navigator.share` |
| Windows | The kit's own native module over `DataTransferManager`, since React Native's `Share` dispatches on iOS and Android only. No package identity is needed. |

A share with neither a message nor a link is disabled rather than opening an
empty sheet. `onShare` reports whether the sheet opened, not what the person
did in it.
