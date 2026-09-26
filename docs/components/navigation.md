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
node, `headerLeft`, `headerRight`, `headerBackVisible`, `headerShown`). A
pushed screen arrives with WinUI's entrance, a short rise and fade rather than
a slide, and `animation: 'fade' | 'none'` changes it. A screen with
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

Props: `routes` (`name`, `href`, `label`, `icon`, `badge`,
`windowsPlacement`), `hidden`, and per platform: `webLogo` (`icon-only`,
`text-only`, `icon-and-text` or a node), `webIcon`, `webActions`,
`webActionsPlacement`, `webFoldHeader`, `windowsPane` (`top`, `left`,
`compact`, `auto`).

| Platform | Renders |
| --- | --- |
| iOS, Android | Expo Router's native tabs: the platform's own tab bar at the bottom, with `badge` as the bar's badge |
| Web | A floating bar along the top with the app's logo, the tabs and action slots. A route's `badge` is a pill beside the label. |
| Windows | A WinUI `NavigationView`: the top bar, or with `windowsPane` the navigation pane down the left side, expanded (`left`), at its glyph-only width (`compact`), or `auto` by the window's width at WinUI's own breakpoints (the expanded pane from 1008 points, the compact one from 641, the top bar below that). The pane's toggle button switches between the two. A count `badge` is an `InfoBadge`; other text is its dot. `windowsPlacement` puts a route at the pane's foot (`footer`) or makes it WinUI's own settings item (`settings`). The control's own back button, at the top of the pane or the start of the top bar, pops a card the stack above pushed over the tabs, or a screen a stack inside a tab pushed; a selection in the pane leaves the drilled-in screens. The button is drawn whenever a stack is around the tabs, disabled at the root as a WinUI app's is, and only while something can pop when the tabs are the root. |

On web a screen under `Tabs` has one bar, not two: `ConstrainedStackHeader`
hands its header to the bar and draws nothing itself. A pushed screen hands
over all of it (the back button in the mark's place, the title where the
app's name goes, `headerRight` where `webActions` go). A tab's own screen
hands over `headerRight` alone and keeps its title, since the tab beside it in
the bar already says it. The bar keeps the height of its tabs, and a header
control folded into it drops to their size. `hidden` hides the tabs rather
than the bar while a pushed screen's header is folded in;
`webFoldHeader={false}` keeps the two rows.

On web the bar is a `navigation` landmark of links, not a `tablist`, since the
tabs move between routes rather than panels; the active one carries
`aria-current="page"`, and a pushed screen's title is the page's `h1`.

The Windows pane width is measured rather than read from the window, since
react-native-windows reports no dimension change when the window is resized.

## TabStack

The stack inside a tab, with the platform's header over the tab's screens.
Props: `title`, `headerRight`. On web its header is `ConstrainedStackHeader`;
on Windows it is the kit's `Stack`. A `HeaderMenu` in `headerRight` survives
Android's header re-parenting; a plain `Menu` in a host does not.

## ConstrainedStackHeader

The web stack header: a row that matches the content's maximum width, or,
under a `Tabs` bar with `webFoldHeader`, nothing at all, since the bar carries
the header. On the other platforms it renders nothing and the native stack's
header is used.

## TabView

Document tabs: a strip of things the user opened and can close, with the
selected one's content under it. These are not the tabs `Tabs` draws.

Props: `tabs` (`id`, `title`, `icon`, `pinned`), `selected`, `onSelect`,
`onClose` (leaving it out takes the crosses away), `onAdd` (leaving it out
takes the add button away), `children` (the selected tab's content), `label`
("Tabs"), `layout` (`auto`, `strip`, `switcher`), `style`, `testID`.
`nextSelection(tabs, closing, selected)` is exported for a caller that closes
the open tab: it moves to the next tab, or the previous one when the last was
closed.

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

Controls for a stack header's trailing slot (`TabStack`'s `headerRight`).
`HeaderMenu` is a `Menu` at the platform's header size; `HeaderAction` is the
same trigger with a press instead of a menu; `HeaderActions` is the row for a
slot that takes one node, and the one host for all of them.

```tsx
headerRight={() => (
  <HeaderActions>
    <HeaderAction label="Share" icon={icon.share} hideLabel tone="label" onPress={share}/>
    <HeaderMenu label="Export" icon={icon.export} hideLabel tone="label" items={exports}/>
  </HeaderActions>
)}
```

A plain `Button` is the wrong thing in a header: the app would have to size
it, it would not shrink when the web tab bar carries the header, and natively
it is a SwiftUI or Compose view that a React Native header cannot hold
without a host. The row spaces its children the way each platform spaces its
own header actions: none on Android, where Material's icon buttons carry
their own 48dp container. On Android the host is rebuilt on every focus
change, since the native stack re-parents the header's views on a tab switch
and a Compose view refuses a second parent, so these need a navigator above
them there. On Windows the row is a plain view of islands.

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
