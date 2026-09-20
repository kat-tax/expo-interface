# Platform roadmap

What each platform can still do that the kit does not yet ask of it, and the
order to do it in. Written 2026-09-19 against Expo SDK 57 / React Native 0.86.3
/ `@expo/ui` 57.0.18 / react-native-windows 0.84 / Windows App SDK 1.8.

**Progress. All fifteen items are done or closed with a reason.** Wave 3 ended
with item 12 done, item 13 closed without building, item 15 done, and
`ShareLink`, the pager, `Chip` and `TabView` all done out of item 14 — except
that item 6 turned out not to be what it said, which is in its own entry.
**§8, "Still open", is the list to read now**: two leftovers inside finished
items, two questions nobody has decided, and a version watch.

**§3.6 is where the "an island cannot hold React Native children" limit was
chased down.** It was the stated reason for shrinking four items; it is real,
but it lives in react-native-windows rather than in XAML, and it was run
rather than reasoned about.

## How to read the matrices

Each item names the control the platform already has for it:

- **native** — the platform ships a control and `@expo/ui` (or WinUI) exposes it.
- **composed** — no single control; built from the kit's own primitives.
- **none** — nothing sensible; the item degrades or is omitted there.

An item is only worth doing when at least two platforms say *native*. The ones
that say *native* on three or four are the ones to do first.

## Standing constraints

Everything below is subject to `AGENTS.md`, and to these in particular:

- **The version wall.** SDK 57 pins RN 0.86.3; RNW's newest line is 0.84. Do not
  add `react-native-windows` to the example or to `expo-windows`' peers.
- **No new native dependencies** unless they have an answer on all four
  platforms. An iOS-only native module is not a kit component.
- **A component is one directory**: `types.ts` plus a file per platform.
- **Never name a module-scope binding after a global.** The React Compiler emits
  `Symbol.for(…)` into every component it compiles.
- **100 % coverage, oxlint clean, tsc clean, both CI workflows green.** Tests
  prove behaviour; the harness is how you see the thing itself. A component is
  not done until it has been driven on web *and* Windows.

---

## 1. New components

### 1.1 Badge

Two platforms have a real control. iOS was expected to be a third and is not —
see the correction below.

| | control |
| --- | --- |
| iOS | **composed** — drawn. `badge` only paints inside `List`, `TabView` or a toolbar |
| Android | **native** — Compose `Badge` / `BadgedBox` |
| Windows | **native** — WinUI `InfoBadge` (dot, numeric and icon forms) |
| Web | **composed** — a span with `aria-label` |

`src/tabs/index.windows.tsx` already draws NavigationView badges by hand. A
`Badge` component would replace that with the real control and give the same
affordance to `ListItem`, `IconToggle`, `HeaderAction` and `Avatar`.

New island: `ExpoInterfaceInfoBadge`.

### 1.2 Empty state

| | control |
| --- | --- |
| iOS | **native** — `ContentUnavailableView` (`title`, `systemImage`, `description`) |
| Android | **composed** — `Column` + `Icon` + `Text` |
| Windows | **composed** — `Surface` + `Icon` + `Typography` |
| Web | **composed** — DOM |

Cheap, and every screen in the example needs one. iOS gets the system's own
layout and its Dynamic Type behaviour for free.

### 1.3 Pull to refresh

| | control |
| --- | --- |
| iOS | **native** — `refreshable` modifier |
| Android | **native** — Compose `PullToRefreshBox` |
| Windows | **native** — WinUI `RefreshContainer` / `RefreshVisualizer` |
| Web | **none** — RN's `RefreshControl` is inert on web |

Native on three, which is unusual. But read the trade-off first: the scrollable
is React Native's, and all three native controls want to own the scroller they
wrap. On Windows an island cannot wrap an RN `ScrollView`. Decide the shape
before writing anything — most likely RN's own `RefreshControl` on Windows and
web, and the native modifiers on iOS and Android.

### 1.4 Chip

**Built, and it clears the bar this document set — the earlier reading of the
matrix was too strict.** What was written:

| | control |
| --- | --- |
| Android | **native** — Compose `Chip` (assist, filter, input, suggestion) |
| iOS | **composed** — `Button` with `buttonBorderShape('capsule')` |
| Windows | **composed** — `Surface` pill |
| Web | **composed** — DOM |

What it is:

| | control |
| --- | --- |
| Android | **native** — `FilterChip`, `AssistChip`, `SuggestionChip` |
| iOS | **native** — SwiftUI `Toggle` in button style, or a capsule `Button` |
| Windows | **native** — WinUI 3 `ToggleButton` with a pill radius, or a pill `Button` |
| Web | **native** — `<button aria-pressed>`, the APG's toggle button |

The correction turns on asking what a chip *is* rather than what it is called.
Only Android has a control named "chip". But a chip is a capsule that is
pressed and may stay pressed, and every platform has that — the question is
only whether the kit reaches for the one that keeps the state or the one that
does not. That is not a styling choice: **a `Toggle` tells VoiceOver it is on,
a `ToggleButton` gives UI Automation the toggle pattern, and `aria-pressed`
gives a screen reader "pressed"**. A button that merely changes colour leaves
a blind reader unable to tell a chosen filter from an unchosen one, which is
the defect class §6.1 exists to catch. So the kit splits on `selected`: given
at all, the chip is the platform's toggle; left out, it is the platform's
button.

Windows needed an island of its own (`ExpoInterfaceChip`) rather than reusing
the icon toggle's, because the two want opposite things from the same control:
the icon toggle replaces WinUI's checked fill with two colours, and a chip
wants that fill, since it is what says a chip is on.

`Surface` was never going to be the Windows answer, and neither is the
Community Toolkit's `TokenView` (§5.3).

**Material's input chip — the one with a remove cross — is deliberately not
here.** It is the only chip kind no other platform has any control for, and
drawing it on the other three would be the kit drawing a chip rather than
using one.

### 1.5 Search field

The component that pays for the `rich-input` research.

| | control |
| --- | --- |
| Android | **native** — Compose `SearchBar` / `DockedSearchBar` |
| Windows | **native** — WinUI `AutoSuggestBox` |
| iOS | **composed** — there is **no `searchable` modifier** in 57.0.18; a `TextField` with a `magnifyingglass` and a clear button |
| Web | **composed** — `<input type="search">` plus a `popover` listbox |

On web, mark the matched substring with the CSS Custom Highlight API (§4.1).
Check `@expo/ui`'s modifier list again before starting — if `searchable` has
landed by then, iOS moves to *native* and this item gets much better.

New island: `ExpoInterfaceAutoSuggestBox`.

### 1.6 Swipe actions on `ListItem`

| | control |
| --- | --- |
| iOS | **native** — `SwipeActions` (`leading`/`trailing`, `allowsFullSwipe`) |
| Windows | ~~native — WinUI `SwipeControl`~~ **not reachable** — see below |
| Android | **none** — `@expo/ui` ships no Compose equivalent |
| Web | **none** — no swipe to reveal them with |

**Corrected after building it.** Windows was listed as native on the strength
of `SwipeControl` existing. It does, and it cannot be used here: a
`SwipeControl` swipes *XAML* content, and `src/list-item/index.windows.tsx`
draws the row in React Native. The same structural limit as §3.2's materials —
an island holds XAML and the row is not. **§3.6 chased this down**: a portal
*can* be connected inside an island, and it is even accessible there, but its
content does not draw — so `SwipeControl` still has nothing of its own to
swipe. The reason is now specific, and upstream could remove it.

So only iOS has a swipe, and the fallback matters more than the feature. It is
not the trailing `action` this section first proposed, which would have
dropped every action after the first: it is **the row's own context menu**,
which is a real `DropdownMenu` on Android, a real `MenuFlyout` on Windows and
a real `popover` on web. The actions stay reachable on every platform, always
through something that platform already teaches. `ListItem` owns that menu
rather than the caller wrapping the row, so the two cannot nest on one gesture.

### 1.7 `ShareLink`

| | control |
| --- | --- |
| iOS | **native** — `ShareLink` (`item`, `getItemAsync`, `subject`, `preview`) |
| Windows | **native** — `Sharing.cpp` already wraps `DataTransferManager` |
| Android | **native** — `expo-sharing` / the share intent |
| Web | **composed** — `navigator.share`, falling back to copy-link |

### 1.8 Pager

**Built, and the matrix below was wrong in both directions.** What was
written:

| | control |
| --- | --- |
| Android | **native** — `HorizontalPager` / `Carousel` |
| iOS | **native** — `TabView` in its page style |
| Windows | **native** — WinUI `FlipView` + `PipsPager` |
| Web | **composed** — scroll-snap (check CSS carousel primitives' status) |

What it is:

| | scroller | indicator |
| --- | --- | --- |
| iOS | **native** — `UIScrollView` paging | drawn — `UIPageControl` is not wrapped |
| Android | **native** — a snapping `ReactScrollView` | drawn — Material's indicator is not exposed |
| Windows | **native** — the composition scroller's snap points | **native** — WinUI 3 `PipsPager` |
| Web | **native** — `scroll-snap-type: x mandatory` | drawn — as a tab list |

Both corrections come from the same place. **`FlipView` cannot be the Windows
answer**, for the reason that has now closed or shrunk four items: a XAML
island holds XAML, and the pages here are React Native's (§3.6 ran the
experiment: React Native content connects inside an island and is accessible
there, but does not draw). Nor can Compose's
`HorizontalPager` or SwiftUI's `TabView` be the other two, because reaching
them means `RNHostView` pages inside a container whose whole job is a drag —
and the kit has already met that fight, in the Android colour picker, which
only works with `sheetGesturesEnabled={false}`. A pager cannot turn its
gestures off.

What is left is better than what was planned, not worse. React Native's
`pagingEnabled` **is** each platform's own paging — `UIScrollView.isPagingEnabled`,
a snapping `ReactScrollView`, `PagingEnabled` on react-native-windows'
composition scroller, and, through react-native-web, `scroll-snap-type: x
mandatory` with `scroll-snap-align` on each page. Four native scrollers, no
hosting boundary, and the only place a platform control still fits is the
indicator — which fits precisely because it has **no children**.

Three things this turned up that are worth keeping:

- **React Native drops `pagingEnabled` on Windows.** `ScrollView` passes it
  to the native view through a `Platform.select` with an `ios` branch, an
  `android` branch and no default, so on Windows it arrives as `undefined` and
  the scroller simply does not page. Nothing warns. `snapToInterval` is passed
  straight through and reaches the same implementation. This is the second
  instance of one shape — `Share` is stopped on Windows the same way (§1.7) —
  and it is worth checking for before blaming the native side of anything.
- **Report the page a scroller settles on, never the ones it passes.** Reading
  the page from every scroll frame means an animated scroll to the third page
  is interrupted at the second and stops there: the kit drives the scroller
  and listens to it, so it hears its own animation. `onMomentumScrollEnd` and
  `onScrollEndDrag` natively, `scrollend` on web.
- **Off-screen pages are `inert` on web.** A carousel that leaves its hidden
  pages in the tab order puts the focus ring somewhere nobody can see — and
  it is also what makes `role="tabpanel"` honest, since exactly one panel is
  live. Verified in a real browser: a button inside an off-screen page cannot
  take focus. axe caught the other half of this on its own, because a
  scrollable region with no focusable content needs `tabindex` of its own.

Seen working on both platforms the bar asks for. On web: the arrow keys move
the tab list, the track scrolls exactly one page width, and the `inert` flag
moves with it. On Windows the UIA tree is the proof the control is real —
`#PreviousPageButton` disabled on the first page, `#NextPageButton`,
`#PipsPagerScrollViewer` and a `Button "Page 1"` for each pip are WinUI's own
template, not anything the kit drew — and pressing the third pip reported
`page 2` back to React and scrolled there.

**And the thing the tests could not see.** The first Windows build drew the
indicator with nothing above it: a page has a width and no height of its own,
a horizontal scroller only stretches its pages to the height *it* has, and a
pager sized by its content has none. Both the pager and its track now grow
and shrink without `flex: 1`, whose basis of zero is the same collapse by
another route. Every test passed throughout — a screenshot is the only thing
that catches this.

### Deliberately not doing

`Chart` (iOS only), `TreeView`, `RichEditBox`, `RatingControl`, `SemanticZoom`,
`AnnotatedScrollBar`. And the WinUI collection controls (`ItemsView`,
`ListView`, `GridView`, `ItemsRepeater`) — React Native owns lists here.

---

## 2. Existing components to make more native

### 2.1 `Toolbar`

- **iOS.** `src/toolbar` has no `index.ios.tsx` at all. `Toolbar` and
  `ToolbarItem` landed in **57.0.18**, along with the `navigationTitle`
  modifier and the `close` button role.
- **Windows.** `index.windows.tsx` is a drawn `Surface` with React Native rows,
  documented as necessary "because every kit control is a XAML island of its
  own here". WinUI's `CommandBar` is the real answer: primary commands,
  secondary overflow, adaptive resizing, labels and keyboard accelerators.
  The trade-off is that its buttons become XAML rather than kit `Button`s, so
  the native path could not accept arbitrary `children`. That is the same split
  `src/popover/index.windows.tsx` already makes between `FlyoutPopover` and
  `DrawnPopover` — follow that precedent.

### 2.2 `Popover`

The Windows implementation uses a plain `Flyout`, which has no tail. WinUI's
**`TeachingTip`** is precisely the control the component's own doc comment
describes: `Title`, `Subtitle`, `ActionButtonContent`, `CloseButtonContent`,
`Target`, `PreferredPlacement`, `IsLightDismissEnabled`, and a tail that points
at its target. It replaces the `Flyout` path exactly.

Two props worth borrowing from `expo-ios-popover` (the package itself is not
worth taking — see §5.4):

- **`preferredEdge`** — maps to SwiftUI's `arrowEdge`, WinUI's
  `PreferredPlacement`, and `position-area` on web. Today the drawn card flips
  vertically only.
- ~~**`trigger: 'tap' | 'longPress' | 'doubleTap'`** on `ContextMenu`, which
  currently hardcodes right-click plus a 500 ms touch long-press.~~ **Done, as
  `'tap' | 'longPress'`.** `doubleTap` is not there, and the reason is the
  useful part: `@expo/ui` exposes only `onClick` and `onLongClick` from
  Compose's `combinedClickable` (Compose itself has `onDoubleClick`, the
  binding does not), and iOS has no answer at all — `onTapGesture` takes no
  count there and a `contextMenu` cannot be opened programmatically. Web has a
  real `dblclick` and Windows could be timed by hand, so it would be two
  platforms with the gesture, one that would need the kit to invent it, and
  one that could not have it. `tap`, by contrast, is a **control** on all
  four: iOS swaps `contextMenu` for a SwiftUI `Menu`, Android moves the menu
  onto `combinedClickable`'s own `onClick`, and web and Windows already own
  the press. The right click and the Menu key keep working in either mode —
  they are what the platform and its screen readers reach for, and a prop that
  took them away would cost more than it gives.

### 2.3 `Menu` and `HeaderMenu`

- **Windows.** A menu trigger is a `Button` plus a `MenuFlyout`. `DropDownButton`
  draws the chevron and its pressed state itself; `SplitButton` gives a primary
  action beside the menu; `CommandBarFlyout` gives the row-of-icons selection
  toolbar. `MenuBar` is the idiom for `HeaderMenu` in a desktop title bar.
- **Android.** `DropdownMenu` gained `shadowElevation` in 57.0.18. One line.

### 2.4 Match highlighting in `Menu` / `PopupMenu`

`filterItems` already matches on `label` and `keywords` and shows the match
unstyled. Highlight it:

- **Web** — the CSS Custom Highlight API, so no wrapper elements are introduced
  and the same label string still renders through RN `Text` on native.
- **Windows** — `Run`s inside the `TextBlock`.
- **iOS / Android** — nested `Text` runs.

### 2.5 `TabView` — document tabs, which are not the tabs the kit has

**Researched and built 2026-09-20. This section replaced the one that called
it "`Tabs` on Windows", which had the shape of the problem wrong; what the
build then changed is at the end.**

Two different controls are called tabs, and mixing them is what made this look
like a Windows gap in an existing component.

| | document tabs | navigation tabs |
| --- | --- | --- |
| Examples | WinUI `TabView`, Chrome, VS Code | `UITabBar`, Material `NavigationBar` |
| How many | unlimited, opened by the user | three to five, fixed by the app |
| Close, add, reorder | yes | no |
| What a tab is | an open document or page | a section of the app |
| On a phone | a card switcher behind a count | a bar along the bottom |
| On a tablet | a real strip, or a sidebar | a top bar or a sidebar |

`src/tabs` is the right-hand column and is finished: `NavigationView` on
Windows, the platform's own tab bar elsewhere. **`TabView` is the left-hand
column, and it is a new component, not a change to that one.** The two share
almost nothing but a name.

#### What the platforms actually do

The reference is WinUI's `TabView`: a row of titles, a close cross on each, an
add button, a strip header and footer, reordering and tear-off.

**Phones keep no strip.** Safari and Chrome on iOS and Android both hide open
pages behind a numbered button that opens a grid of cards, each with its own
close cross — not a row of tabs. iOS 26 Safari's default "Compact" toolbar
goes further and merges the address field with the tab controls into a pill
that shrinks as the page scrolls. The exception that proves the rule is
Vivaldi, the only mainstream mobile browser with a real closable strip; even
it shows the cross only on the active tab, to save width, and stacks two rows
when tabs are grouped.

**Tablets and foldables get the real thing.** Past roughly tablet width —
600 dp on Android, iPad generally — Safari grows its "Separate Tab Bar" (a row
of titled tabs with close buttons, the address field alongside), and Chrome on
Android tablets grows a desktop-like strip that drops the close buttons as
tabs get narrow. Firefox has had a tablet strip for years.

**There is no first-party document-tab control on iOS or Android.** Both
platforms' own `TabView` and `TabRow` are the navigation kind. A document
strip is composed everywhere except Windows.

#### The shape to build

| | strip (wide) | switcher (narrow) |
| --- | --- | --- |
| Windows | **native** — WinUI 3 `TabView` | drawn grid |
| iOS | drawn strip | drawn card grid |
| Android | drawn strip | drawn card grid |
| Web | drawn strip, the APG tab pattern | drawn card grid |

**One native platform, and this one was built anyway** — the opposite call to
the one this document's own two-platform bar asks for, so it needs a reason.
`Chip` failed that bar on a miscount: asking "does the platform have a control
for a capsule that stays pressed" turned one into four. Asking the same
question here does not. A document strip is genuinely a control only Windows
ships, and the earlier draft of this table was wrong in the other direction —
there is no "strip of SwiftUI buttons" or "of Compose buttons" to draw it with
either, because a strip of tabs is not a row of buttons to a screen reader and
`@expo/ui` exposes no tab primitive at all. It is React Native on both.

What carries it instead is that **three of the four still get the shape their
own platform teaches**: under 640 points nobody draws a strip, and the count
button over a grid of cards is exactly what Safari and Chrome do on iOS and
Android. So the bar it passes is not "two platforms have the control" but
"every platform gets what its users already know", which is the thing the bar
was a proxy for.

**One breakpoint, and the kit already has the machinery.** `src/tabs`'
`resolvePane` picks a Windows pane from a measured width at WinUI's own 641
and 1008 points, falling back to `useWindowDimensions` for the first frame
because react-native-windows reports no dimension change when a window is
resized. A `TabView` wants the same treatment with one threshold — **640
points**, which is both WinUI's compact breakpoint and Android's medium window
class — below which the strip becomes a count button and a grid, and above
which it is a strip. Measured, not guessed: a navigation pane beside it
changes the room a strip has without the window changing size at all.

**The cards cannot be thumbnails.** Safari and Chrome draw a live preview of
each page; the kit cannot, because snapshotting arbitrary React Native content
needs a dependency it does not have. A card is a title, an icon and a close
cross — which is what a switcher over an app's own documents, rather than over
web pages, would want anyway.

The keyboard is already solved on web: `useRovingFocus` from §6.3 is the
strip's pattern, and the close cross inside each tab is the one place the
roving contract needs care, since a tab holding a second focusable is a
composite inside a composite.

#### The one thing that had to be settled first — and how it came out

Whether WinUI's `TabView` can be **the strip alone**. Its tab content would
have to be React Native's. **§3.6 had already run that experiment**, and it
came back half-negative: a React portal connects inside a XAML island and is
accessible there, but its content does not draw, for reasons in
react-native-windows rather than in XAML. So a `TabView` whose `TabViewItem`s
hold portals was the right thing to want and not something to build on.

**The fallback was taken, and it works.** `TabViewItem`s with no content at
all, the island sized to `TabViewItemHeaderHeight`, and the selected page
drawn underneath by React Native. An item with nothing in it is still the
control's own tab — Narrator reads it as one, the close cross and the add
button are Fluent's, and the strip is the platform's even though every page
under it is not.

One thing it costs: **reordering is off**. `CanReorderTabs` and `CanDragTabs`
are both false, because a drag would move the tab in the control while the
kit's own array stayed as it was and the next render put it back. A strip that
silently undoes a drag is worse than one that never offered it; this comes
back the day there is an `onReorder` to answer with.

Worth knowing for the web half: Chrome supports `display_override: ["tabbed"]`
with a `tab_strip` manifest entry, which gives an *installed* web app a real
browser-drawn tab strip. That is the browser's chrome rather than a control in
the page, so it is not this component — but it is the better answer for an
installed app that wants document tabs, and worth saying so rather than having
someone rediscover it.

#### What building it found, which the research had not

**A tab strip cannot have a second announced control per tab, on web.** This
section guessed the close cross would need "care" in the roving contract. It
needs more than care: there is no arrangement that works.

- A `<button>` **inside** `role="tab"` is never exposed at all — ARIA makes
  the children of `tab` presentational — and axe fails it as
  `nested-interactive`.
- Moving it **beside** the tab, inside the `tablist`, fails the other way:
  `tablist` does not allow a button among its children, and axe fails it as
  `aria-required-children`.

Both were tried, in that order, and both are real defects rather than
pedantry. So on web the cross is a **pointer affordance** (`aria-hidden`, not
focusable) and the keyboard closes with **Delete on the tab**, which each
closable tab announces for itself through `aria-keyshortcuts`. iOS and Android
have no such rule and keep a real button beside the tab that VoiceOver and
TalkBack both reach; Windows gets the control's own cross. **Web is the
strictest platform here**, which is the reverse of the usual direction in this
document and worth knowing before designing the next composite.

**An `aria-labelledby` target is read whole, `aria-hidden` children
included.** The panel was named after the open tab, and the kit draws an icon
as a Material Symbols *ligature* — the glyph's name as text — so the panel
came out called `"descriptionREADME.md"`. Naming it after the tab's **title**
rather than the tab fixes it. Nothing in the suite could see this: the unit
tests asserted the relationship, axe passed, and only the harness's
accessibility tree — the thing a screen reader would actually say — showed the
name. It belongs beside §6.1's defect class.

**Two things were wrong on screen and right in every test**, which is now
three sessions running: the switcher's cards were 140 points wide, which left
about six characters for a file name, so every card clipped `README.md` to
`README` with no ellipsis to admit it.

### 2.6 `Icon` on Windows

`SEGOE_GLYPHS` plus `FontIcon` means only glyphs Segoe Fluent happens to have.
`PathIcon` (arbitrary vector geometry), `ImageIcon`, and `AnimatedIcon` (for the
state transitions iOS and Compose already animate) all exist.

### 2.7 `Gauge` on Windows

The Community Toolkit's `RadialGauge` looks like the answer and is not — see
§5.3. Keep the drawn `Ellipse`.

---

## 3. Cross-cutting capabilities

### 3.1 Accessibility, and why it is first

`XamlHost.cpp:237` sets `AutomationProperties::SetName` and nothing else, and
`scripts/harness/windows/snapshot.ps1` resolves nodes by `Name`. That means a
Windows test finds an element by the text a person reads — which breaks when
the label changes and would break under localisation.

**Set `AutomationProperties.AutomationId` from `testID`.** Then `by.testID()`
resolves identically on all four platforms, and the device suite stops
depending on copy. This is the single highest-leverage item in the document
because everything after it is easier to test.

Also unused, also cheap, and each one improves both Narrator and the
`toBeFullyLabelled` matcher that has already caught three real defects:

| property | where |
| --- | --- |
| `HelpText` | any control with a hint |
| `HeadingLevel` | `Typography` heading variants, `ScreenHeader` |
| `LandmarkType` | `Screen`, `Toolbar`, `Tabs` |
| `LiveSetting` | `Toast` / `InfoBar` |
| `PositionInSet` / `SizeOfSet` | `Tabs`, `SegmentedControl`, list rows |
| `IsDialog` | `Alert`'s `ContentDialog` |

### 3.2 Materials — the same finding on iOS and Windows

One design question, "does a `Surface`, `Sheet` or `Popover` have a material?",
with a native answer on both platforms and **zero uses of either today**:

- **iOS.** 57.0.15–57.0.17 taught `background`, `foregroundStyle`, `tint`,
  `containerBackground` and `presentationBackground` to take a full `ShapeStyle`
  — materials (`ultraThin` … `bar`), gradients, hierarchical styles. Plus
  `glassEffect`, `glassEffectId` and `GlassEffectContainer`.
- **Windows.** No `MicaBackdrop`, `DesktopAcrylicBackdrop` or `AcrylicBrush`
  anywhere. `Overlays.cpp:630` already remarks that "WinUI's pane fills are for
  a Mica window". Flyouts and dialogs are real XAML windows, so they can carry a
  backdrop even though the app content belongs to RNW.

This is also what `expo-ios-popover`'s `background: plain | blur | liquid glass`
prop points at — a capability we already have and have not spent.

**Item 11 closed the Windows half of this on the grounds that an island would
take the pointer input of whatever it covered. §3.6 tested the way around
it** — a portal contains its children instead of covering them — and found
that such content connects and is accessible but does not draw. So the
objection stands for now, for a different reason than it was given. The
question item 11 actually could not answer — whether acrylic samples anything
across a separate content root, or comes out black — was never reached.

### 3.3 Elevation

`ThemeShadow` on Windows for `Surface raised` and for flyouts. Android already
uses `dropShadow`.

### 3.4 Motion

All exported, none used: `matchedGeometryEffect`, `geometryGroup` and
`withAnimation` on iOS; `AnimatedVisibility` on Android; theme transitions
(`EntranceThemeTransition`, `RepositionThemeTransition`) and
`ConnectedAnimationService` on Windows.

### 3.5 Keyboard and pointer on Windows

`KeyboardAccelerator`, `XamlUICommand` and `StandardUICommand` put accelerators
in XAML, where menu items render their own key tips — instead of the JS-level
`useKeyboardShortcut`. `InputSystemCursor` gives islands hover cursors.

---

### 3.6 Nesting React Native inside a XAML island — half of it works

**Read 2026-09-20, then run the same day. The reading was right about the
APIs and wrong about what they buy: it connects and it is accessible, and it
does not draw. The spike's result is at the end of this section and is the
part to believe.**

Four items in this document have been shrunk or closed with one sentence —
*an island cannot hold React Native children* — and that sentence is not where
the limit lives.
Every piece needed to nest React Native content inside a XAML island is public
in the versions the kit already pins, and react-native-windows uses most of
them itself.

| Piece | Where | Verified by |
| --- | --- | --- |
| React content as a `ContentIsland` | `ReactNativeIsland.CreatePortal(portal)` → `.Island` | RNW 0.84 `ReactNativeIsland.idl`; RNW's own `Modal` calls it |
| A component that *is* a portal | `IReactCompositionViewComponentBuilder.SetPortalComponentViewInitializer` | the same builder interface the kit already calls `SetContentIslandComponentViewInitializer` on |
| Layout for the portal's content | `IPortalStateData` — `LayoutConstraints` and `PointScaleFactor`, documented as "used to layout the content of the Portal" | RNW 0.84 `IReactCompositionViewComponentBuilder.idl` |
| Nesting one island in another | `Microsoft.UI.Content.ChildSiteLink.Create(parentIsland, containerVisual)` then `.Connect(childIsland)` | present in the Windows App SDK 1.8 metadata; RNW uses it for the *opposite* direction in `ContentIslandComponentView` |
| A XAML element to anchor it to | `ElementCompositionPreview.SetElementChildVisual(element, containerVisual)` | present in the 1.8 XAML metadata |
| The parent island itself | `XamlIsland::m_island.ContentIsland()` | already held by the kit's own `XamlHost.h` |

`ContentIsland` has carried a `Children` property — "the `ChildSiteLink`
objects parented to this `ContentIsland`" — since the API arrived, and its own
documentation describes islands as composing into a scene, "equivalent to
child windows because they allow the scene to be subdivided". Nesting is the
design, not a loophole. **None of this needs Windows App SDK 2.0**; it is all
in the 1.8 the version wall pins.

The shape, then, for any control that has to wrap React Native content:

1. Register the component with `SetPortalComponentViewInitializer` instead of
   `SetContentIslandComponentViewInitializer`.
2. `ReactNativeIsland::CreatePortal(portal)`, and keep its `.Island()`.
3. Build the XAML control as now, and put a `ContainerVisual` under whichever
   element should hold the React content, with `SetElementChildVisual`.
4. `ChildSiteLink::Create(m_island.ContentIsland(), container)` and
   `.Connect(reactIsland)`, then keep `ActualSize` and
   `LocalToParentTransformMatrix` in step with XAML's layout — which is what
   `ContentIslandComponentView::ConnectInternal` does in the other direction,
   and is the file to copy.
5. Focus through `InputFocusNavigationHost::GetForSiteLink`, automation
   through the child site link's provider — again as that file does.

#### What it looked like this would re-open

Written before the spike ran, and left here because the reasoning is still
what a fix upstream would unlock — but read the result below first: none of
these are open today.

- **§1.6, swipe actions on Windows.** `SwipeControl` swipes XAML content; with
  the row's React Native content inside it as a portal, it has something to
  swipe. This was the item the limit closed most cleanly.
- **§3.2, materials on `Surface` and `Popover`.** The objection was that an
  island would take the pointer input of whatever it covers. A portal does not
  cover its children — it contains them — so an `AcrylicBrush` behind them
  becomes answerable, and the separate question of whether acrylic can sample
  RNW's composition content behind a different content root is still open.
- **§2.5, `TabView`.** This is the spike that section asked for. It would have
  let the `TabViewItem`s hold their own pages; since they cannot, the
  component shipped with the fallback instead — items with no content, sized
  to the strip, the page drawn underneath by React Native. That works, so this
  one is an improvement waiting rather than a gap.
- **§1.8, the pager.** `FlipView` becomes possible. It is *not* a regret —
  `pagingEnabled` is the platform's own scroller on all four and the shipped
  component has no hosting boundary at all, which is still the better trade —
  but the matrix's reasoning should say "not needed" rather than "not
  possible".

§1.3, pull to refresh, stays closed: the limit was only one of its three
reasons, and the other two — React Native already provides it, and the kit
owns no scrollable — hold on their own.

#### The spike, run 2026-09-20: it connects, it is accessible, it does not draw

Built as `ExpoInterfacePortalProbe` (a XAML island holding a `Border`) plus
`ExpoInterfacePortal` (`SetPortalComponentViewInitializer`), with a React
`<View>` and `<Body>` inside the portal, and every step reporting through a
`DirectEventHandler` so the answer could be read out of the automation tree.
Eight build-and-look cycles in the RNW 0.84 harness. **The code is not in the
repository**: it would have been two components that do nothing, and the
recipe below plus RNW's own `ContentIslandComponentView.cpp` is enough to
rebuild it in an hour.

**What worked, first time and every time:**

```
portal=found | island=created | visual=container attached |
link=created | connect=connected | mounted=called | root=sized
```

Every call in the chain succeeded and `ContentIsland.IsConnected()` came back
true. Better than that, **UI Automation crossed the boundary**: the React
`Text` inside the portal appeared in the app's UIA tree, nested under the XAML
island's subtree, carrying the `testID` the kit had given it. That is the part
that looked hardest and it needed nothing.

**What did not work: it renders nothing.** The blue XAML `Border` drew; the
React content inside it never appeared.

**Why, as far as reading the source goes.** A portal's island is a *fragment*
(`ReactNativeIsland`'s `CreatePortal` constructor sets `m_isFragment(true)`),
and the fragment path is not built for a host outside react-native-windows:

- `ReactNativeIsland::Measure` throws `E_ILLEGAL_METHOD_CALL` on a fragment,
  and `Arrange` deliberately skips its layout path (`!m_isFragment`). A host
  cannot size a fragment island through the island API at all.
- `ReactNativeIsland::Size()` therefore stays `0x0`, because the code that
  sets it is the code `Arrange` skips. The site's own `ActualSize` was right
  (`220x60`) and the rasterization scale was 1, so the site is not the
  problem.
- A fragment is meant to be sized from the React side instead —
  `PortalComponentView::updateLayoutMetrics` hands the portal component's own
  Yoga metrics to its content root — but giving the portal an explicit
  `width` and `height` in JavaScript did not make it paint.
- RNW's own "the island is mounted" wiring (`ContentIsland.Connected` →
  `OnMounted`) is compiled out unless RNW was built with
  `USE_EXPERIMENTAL_WINUI3`, so a host that connects an island itself has to
  call `OnMounted` through
  `Composition.Experimental.IInternalCompositionRootView`. Doing so succeeded
  and changed nothing.
- Sizing the island's root visual by hand changed nothing either.
- The likely root of it: `CreatePortal`'s constructor calls
  `RootComponentView::start`, which calls
  `ReactNativeIsland::AddRenderedVisual` →
  `InternalRootVisual().InsertAt(visual, 0)` — and `InternalRootVisual` is
  only *created* when `Island()` is first read, which a host necessarily does
  afterwards. The content's visual and the island's root visual are set up in
  an order a caller cannot get between. RNW's own `Modal` does not hit this
  because it hands the island to `ReactNativeWindow::CreateFromContentSiteBridgeAndIsland`,
  which is not public and does more than read `Island()`.

**So the limit is real, but it is not where this document said it was.** It is
not in XAML, and not in the Content API: `ChildSiteLink` nests islands exactly
as documented, and accessibility follows. It is in what react-native-windows
exposes for driving a *fragment* island — layout is refused to the host and
handed to a React side that a host cannot reach, and the one visual that
matters is parented before the host can act.

What that means for the items §3.6 re-opened: they are **not** re-opened
today. `SwipeControl` still has nothing of its own to swipe, `Surface` still
cannot carry an acrylic behind React Native children, and `TabView`'s
`TabViewItem`s still cannot hold pages (§2.5 shipped without needing them to:
the strip alone is enough). The difference is that the reason is
now specific, in files that can be pointed at, and it is a reason that an
upstream change could remove — a public way to size a fragment island, or a
`CreatePortal` that parents its content after the island's root visual exists.
That is a react-native-windows issue worth filing, not a fact about Windows.

**Re-run it like this**, if that changes: register one component with
`SetContentIslandComponentViewInitializer` (a `Border` with a `Grid` inside)
and one with `SetPortalComponentViewInitializer` (a trivial user-data type is
required — the generated registration reaches for one on every props update);
nest them in JavaScript; from the island, find the portal among
`ComponentView.Children()`, `ReactNativeIsland::CreatePortal(portal)`,
`ElementCompositionPreview::SetElementChildVisual(grid, containerVisual)`,
`ChildSiteLink::Create(ContentIsland(), container)`, `ActualSize`, `Connect`.
Children are mounted around the props update rather than before it, so do the
lookup from a `DispatcherQueue.TryEnqueue` and retry until it takes.

---

## 4. Web

### 4.1 CSS Custom Highlight API — adopt

`CSS.highlights` plus `::highlight()` styles arbitrary ranges without wrapping
text in elements. Baseline in 2026 (Firefox 140 completed the set in June 2025)
and an Interop 2026 focus area. Allowed properties are limited to `color`,
`background-color`, `text-decoration`, `text-shadow` and the
`-webkit-text-stroke`/`fill` family — enough for a match highlight, not enough
for pills.

**It cannot highlight inside a form control's value.** That is what
`rich-input` needs OpaqueRange for, and it means this does nothing for
`TextField`. Use it for §2.4 and for §1.5's web listbox.

### 4.2 Caret-anchored `PopupMenu` — done, web only, and it says so

`PopupMenuProps` documented "the caret in an editor" and "a menu typed into (a
slash command)" and took `at: MenuPoint | null` and `filter`, and nothing in
the repository could produce that caret point. `src/caret` closes it.

**A function, not a hook.** The plan guessed `useCaretPoint()`; there is
nothing to remember between calls, so `caretPoint(field, within)` is the whole
API — call it when the caret moves.

The measurement is the hidden mirror-div `rich-input` falls back to and
`textarea-caret-position` established: the field's text is laid out a second
time in a `<div>` wearing its typography and content width, with a `<span>` at
the caret, and the span reports where it landed. The browsers have never
offered better for a form control, for the same reason §4.1 records — the text
inside one is not in the document.

**Scoped to web, and the other three say why.** `src/caret/index.ts` answers
`null` and names what each platform would need: `UITextInput.caretRect(for:)`,
`Layout.getPrimaryHorizontal` with `getLineTop`, and
`ITextRangeProvider::GetBoundingRectangles`. Three native modules to place one
menu, against a kit with one native module in total. A caller that gets `null`
anchors the menu somewhere it can — under the field — which is what the
`SlashCommand` story does.

Verified in a real browser rather than in jsdom, which lays nothing out: with
two lines of text and a `/h` typed at the end of the second, the menu opens at
the caret, and the x agrees to the pixel with an independent measurement (the
prefix laid out in a span wearing the field's font, plus its border and
padding). The y is right to a pixel or two only when `line-height` is
`normal`, because that is the one case where the line height is an estimate
rather than a length — which the code says.

### 4.3 Not taking

OpaqueRange (Chromium 152+, experimental, no Safari or Firefox), and
`ElementInternals`, `::part()` and `<datalist>`, which solve the
custom-element packaging problem a React kit does not have. Their popover
placement is `popover` plus anchor positioning with try-fallbacks, which
`src/menu/menu.css` already ships, alongside feature-detected `interestfor` in
`src/tooltip`.

### 4.4 A DOM `TextField` — decided 2026-09-20, and the answer is no

`src/text-field/index.tsx` is react-native-web's `TextInput`, while `Menu`,
`ContextMenu` and `Tooltip` are real DOM with their own CSS. This section used
to ask whether to move it, and the honest answer turned out to be that the
question mistook a pattern for a principle.

**Those three are real DOM because they are *floating* UI**, where the
platform gives something React Native cannot: the top layer, light dismiss,
anchor positioning, the Interest Invoker API. That is the prize, and it is what
made each rewrite worth its risk. **A text input has no equivalent prize.**
react-native-web already renders a real `<input>`; moving it would re-implement
the RN `TextInput` prop surface the kit's own components lean on, put every
consumer's usage on a compatibility footing, and buy tidiness.

So it stays as it is, and "the kit's web files are real DOM" is not a rule the
kit holds — the rule is **"use the platform where the platform is better"**,
which for floating UI means the DOM and for a text field means leaving a
working input alone. Reopen it only if something concrete needs what
react-native-web's input cannot do.

---

## 5. Dependencies and version watch

### 5.1 Windows App SDK 1.8 has left support

| version | released | end of servicing |
| --- | --- | --- |
| 2.0 (stable 2.5.1) | 2026-04-29 | 2027-04-29 |
| **1.8** | 2025-09-09 | **2026-09-09 — passed** |
| 1.7 | 2025-03-18 | 2026-03-18 — passed |

We are on 1.8 transitively through RNW 0.84, and we cannot move ahead of RNW.
This is a watch item, not an action: track their bump and be ready for it.

### 5.2 `@expo/ui` deprecations — none in use

`backgroundOverlay` (deprecated 57.0.16), `border({color})` and `strokeBorder`
(deprecated 57.0.17) have **zero occurrences** in `src/`. Nothing to migrate.
`foregroundStyle` is used 34 times and is unaffected.

### 5.3 The Windows Community Toolkit is C#

`RichSuggestBox`, `TokenizingTextBox`, `Segmented`, `SettingsCard`,
`SettingsExpander` and `RadialGauge` all look like direct answers to items
above. They ship as .NET assemblies (`CommunityToolkit.WinUI.*`), and
`windows/ExpoInterface` is C++/WinRT, which cannot reference them. **Borrow the
design, not the package.**

### 5.4 Not taking `expo-ios-popover`

iOS 15.1+ only, a new native module to maintain against RN 0.86, and
`src/popup-menu/index.ios.tsx` already presents the same UIKit popover through
`@expo/ui`'s `Popover`. Take the three props in §2.2 instead.

### 5.5 Other iOS surface not yet reached

`NavigationStack`, `NavigationLink` and `NavigationDestination` arrived in
57.0.18 with `path` / `onPathChange`. They overlap expo-router's own native
stack, so `src/router/stack.tsx` should only move after someone decides which
owns the history. Also unreached: `Form`, `Section`, `List`, `Grid`, `Mask`,
`Overlay`, `ControlGroup`, `LabeledContent`, `ShareLink`, `alignmentGuide` with
`listRowSeparatorLeading`, `scrollClipDisabled`.

And on Android: `DateRangePicker` / `DateRangePickerDialog` (57.0.17) would
give `DateTimePicker` a `range` mode — on Android only, since iOS has no native
range picker. `VerticalSlider` (57.0.16) would give `Slider` an orientation.

---

## 6. Accessibility

### 6.1 The defect class nothing is catching

The kit declares ARIA composite roles on web and does not implement the
keyboard contracts those roles promise.

- `src/menu/list.tsx` renders `role="menu"` with `role="menuitem"` children
  inside a `popover="auto"`. The ARIA menu pattern wants **one** tab stop,
  arrow keys, Home/End and typeahead. Today every item is its own tab stop and
  the arrow keys do nothing. Opening does focus the first item, which is right.
- `src/segmented/index.tsx` renders `role="radiogroup"` with `role="radio"`
  buttons. The radio-group pattern wants roving tabindex and arrow keys.
  Neither is there.
- `src/tabs/index.web.tsx` uses `role="button"` and no tab pattern at all.
  Decide it rather than patch it: it is a router tab bar, so `<nav>` with links
  is the more honest markup — and then there is no pattern left to implement.

**axe cannot see any of this.** It checks static semantics; it does not press
ArrowDown. `@storybook/addon-a11y` runs axe over every story with
`parameters.a11y.test: 'error'` and is green while this ships. It is the same
shape as the `Symbol` bug: the suite passes and the thing is broken.

**A second member of the class, found building `TabView` (§2.5): a name that
is valid, asserted, axe-clean and wrong.** Its tab panel was named after the
open tab through `aria-labelledby` — the textbook relationship — and a
referenced element is read **whole**, `aria-hidden` descendants included. The
kit draws an icon as a Material Symbols *ligature*, which is the glyph's own
name as text, so the panel came out called `"descriptionREADME.md"`. The unit
test asserted the relationship and passed. axe passed. Only the harness's
accessibility tree, which prints what a screen reader would actually say,
showed it.

So the rule that comes out of it: **an element referenced by `aria-labelledby`
must be the text and nothing else** — a title span, never a container that
also holds an icon. And the way this class gets caught is by reading the tree,
not by asserting the attribute that produces it.

### 6.2 What the platform already gives, and must not be handed back

| Behaviour | Where it comes from today |
| --- | --- |
| Focus trap, Escape, inert background | `<dialog>` + `showModal()` in `src/alert` |
| Full keyboard, and the native picker on mobile | `<select>` in `src/picker` |
| Arrow / Home / End / PageUp | `<input type="range">` in `src/slider` |
| Top layer, light dismiss, `aria-expanded` | `popover="auto"` in `src/menu` |
| Placement and flipping | CSS anchor positioning, `position-try-fallbacks` |
| Hover and focus hint, with the system delay | `interestfor`, feature-detected, in `src/tooltip` |
| Press, Enter/Space, disabled | real `<button>` throughout |

That table is why the library question mostly answers itself.

### 6.3 Decision: a hook, not a library

**Base UI 1.8.0** depends on `@floating-ui/react-dom`. Adopting it means
replacing CSS anchor positioning with JavaScript positioning.

**React Aria** (`react-aria-components` 1.21.1 → `react-aria` 3.52 +
`react-stately` 3.50 + `@internationalized/date`, `/number`, `/string`) pulls
`aria-hidden` to do by hand what `<dialog>` does natively.

Both are good libraries for a kit that starts from `<div>`. This one starts
from the platform, on four platforms, and on three of them the native control
already supplies every behaviour in §6.2. Four more reasons:

1. The gap is **one pattern on two components**, not forty components.
2. Both are React-DOM-only, and `index.tsx` here is frequently shared with
   native — only five components have an `index.web.tsx`, so adoption would
   force that split first.
3. Coverage is 100 % on all four metrics. Every branch in the adapter would
   need a test, and jsdom exercises focus and positioning poorly.
4. `expo-interface` is published. Every consumer would pay the bundle.

**Build `useRovingFocus` in `src/a11y/`:** one tab stop, arrow keys along an
axis, Home/End, typeahead, wrap or clamp, skipping disabled items. Apply it to
`Menu` / `ContextMenu` / `PopupMenu` and to `SegmentedControl`. That is the
entire web gap.

> **Revisit this decision when — and only when — the kit grows a pattern the
> hook does not cover:** combobox or autocomplete, a real menubar, tree, or
> grid. Note that §1.5's search field **is** a combobox, one of the hardest
> patterns in the APG. Prefer `<datalist>` or `<select>` there. If neither
> fits, that one component is the honest case for a dependency — and it can
> take one without the rest of the kit taking it.

### 6.4 The other three platforms

Labels are done: 48 `accessibilityLabel`s on iOS, `contentDescription` and
`role` on Android, `AutomationProperties::SetName` on Windows. Everything past
labels is thin — 5 hints, 4 values and 1 live region across 48 components.

| | Today | Worth adding |
| --- | --- | --- |
| iOS | label ×48, hint ×5, value ×4, addTraits ×4 | `accessibilityInputLabels` (Voice Control), `accessibilityElement`, `accessibilityHidden` on decoration |
| Android | role ×12, contentDescription ×6, semantics ×1 | `stateDescription`, `liveRegion`, `heading`, `collectionInfo` |
| Windows | Name, AutomationId, HeadingLevel, HelpText, PositionInSet / SizeOfSet | what react-native-windows can answer is now done — see below |
| Web | roles and labels are good | the keyboard patterns in §6.1 |

#### What the Windows row cost, and where it stops (2026-09-20)

**Most of it was already there and nobody could see it.** react-native-windows'
composition automation provider answers ten UI Automation properties straight
from React Native view props — `HelpText` from `accessibilityHint`,
`PositionInSet` / `SizeOfSet` from `accessibilityPosInSet` /
`accessibilitySetSize` (Windows-only props its own components forward and
React Native does not type), `LiveSetting` from `accessibilityLiveRegion`,
`ItemStatus` from `accessibilityState.busy`, plus `Level`, `HeadingLevel`,
`AccessKey`, `ItemType` and `FullDescription`. None of this needs C++.

**So the work was mostly making it visible.** The harness's UI Automation
snapshot reported role, name and `AutomationId` and nothing else, which means
a control that set none of these read identically in the tree to one that set
them all. It now reports `help`, `inSet` ("3 of 7"), `heading`, `live`,
`status` and `dialog`, printed only where they exist. This is the §6.1 defect
class again: the property that is missing is invisible in a test, in axe, and
in a screenshot — the tree is the one place it shows.

Then two real gaps closed:

- **The tabs the kit draws are numbered, and now named.** `TabView`'s drawn
  strip and its switcher cards carry `inSet`, through `src/a11y/set.ts` —
  empty on the other three by design, since a control numbers its own items,
  iOS derives the position, Android has no React Native prop for
  `collectionItemInfo`, and the kit's web files write a real `tablist` that
  carries the count already. Reading the tree then caught a defect in the
  component shipped an hour earlier: **the drawn cards had no accessible name
  at all** — react-native-windows composes no name from the text inside a
  view, so Narrator announced "1 of 3, tab" and stopped. They are labelled
  explicitly now.
- **`Tooltip` on Windows says nothing to Narrator, and cannot.** The obvious
  fix was tried and measured: `accessibilityHint` on the wrapper is where
  `HelpText` comes from, but the wrapper is not what takes the focus — the
  control inside it is, and react-native-windows composes nothing from an
  ancestor. So the hint went unsaid and the change was reverted with the
  reason in the file. Putting it on the control is the only thing that works,
  and `Tooltip` does not own its children; an app that needs the text
  announced should set `accessibilityHint` on the control itself. iOS differs
  only because SwiftUI merges a `Group`'s children into one element.

**Where it stops, and why.** `IsDialog` and `LandmarkType` are **not
reachable**: react-native-windows' provider has no case for either, so no
React Native prop reaches them. They would need each island to set
`AutomationProperties` in C++, or an upstream change — and most of the kit's
Windows surface is a XAML island, which carries its own UI Automation anyway
(a WinUI `TabView` numbers its tabs, an `InfoBar` is its own live region).
That is also why so few of these properties have a home here: the kit draws
very little on Windows, which is the point of it.

**`accessibilityInputLabels` on iOS is not being taken.** It is alternative
*spoken* names for Voice Control — "star" as well as "add to favourites" —
and only an app's own vocabulary knows them. The kit would be adding a prop
across dozens of components for something it cannot fill in itself. It belongs
in an app.

#### Two things about the harness, learned the hard way

**`GetCurrentPropertyValue(property, true)` is a trap.** Asking UI Automation
to ignore the default hands back `NotSupported`, which reaches PowerShell as a
bare `System.__ComObject` that `-eq` will not match — so every property reads
as set, on every node, and the tree fills with elements that say nothing. Ask
for the default instead (the one-argument overload) and an unsupported
property comes back as `''`, `0` or `$false`. A second trap sits behind it:
react-native-windows returns **-1**, not 0, for an unset `PositionInSet`, so
"unset" means "below one" rather than "zero".

**The Windows tree cannot see a flyout.** The snapshot walks the descendants
of `MainWindowHandle`, and a WinUI `MenuFlyout` — which the kit gives
`ShouldConstrainToRootBounds(false)` so it is not clipped to a small island
(§2.2) — is a *separate top-level window*. A menu that is plainly open on
screen leaves no trace in the tree at all. Verify menus with a screenshot,
which is how `ContextMenu trigger: 'tap'` was confirmed on Windows: the tree
said nothing had happened and the picture showed the flyout open at the press
point, "Delete" in the destructive red.

### 6.5 How it gets caught next time

axe cannot press keys, so add the two layers that can.

1. **Unit.** `userEvent.keyboard('{ArrowDown}')` in the web tests, asserting
   `document.activeElement`. Cheap, immediate, and it covers the hook itself.
2. **Device.** A `toSupportArrowNavigation` matcher in
   `vitest/device/matchers.ts`, beside `toBeFullyLabelled`: press an arrow, take
   a fresh snapshot, assert the focused node moved. `SnapshotNode` already
   carries `focused` on every platform, and this is the only layer that sees a
   real renderer.
3. Keep `toBeFullyLabelled`. It has caught three real defects so far.

---

## 7. Order

**Wave 1 — self-contained, native nearly everywhere, no new dependencies.**

1. ~~`AutomationId` from `testID`, and `by.testID()` in the harness (§3.1).~~
   **Done, `a0de301`.** Two things it turned up: WinUI control templates carry
   `AutomationId`s of their own, so an id in the tree is not necessarily one
   the kit set; and a Release bundle must be compiled by the Hermes in RNW's
   NuGet package rather than the `hermesc` in `node_modules`, because the
   bytecode versions differ and a mismatch loads as an empty window with no
   error anywhere.
2. ~~`useRovingFocus`, applied to `Menu` and `SegmentedControl`; settle `Tabs`'
   markup; add the keyboard test layer (§6.1, §6.3, §6.5).~~ **Done, `e52c02b`.**
   `Driver.key` is optional and skipped where a backend cannot send one;
   `toSupportArrowNavigation` compares what is focused by what it *is*, since
   refs are numbered per snapshot. Two traps: a device test can pass against a
   **cached Metro bundle**, so falsify it after `expo start --clear` or it
   proves nothing; and `toBeFullyLabelled` needs the real accessible-name
   algorithm, because a checkbox is an empty `<input>` that takes its name from
   the `<label>` around it.
3. ~~`Badge` (§1.1).~~ **Done, `4bfda38`.** iOS is drawn after all: SwiftUI's
   `badge` modifier only paints inside a `List`, a `TabView` or a toolbar, and
   elsewhere it is accepted and renders nothing. Windows shows the cap where
   the others show `99+`, because `InfoBadge` holds a number and nothing else.
   `bun run codegen:windows` was **silently deleting every generated header** —
   the glob reached the tool unexpanded, it matched nothing, and it deleted
   rather than failed. Fixed by quoting the pattern.
4. ~~Empty state (§1.2).~~ **Done.** iOS 17+ gets `ContentUnavailableView`;
   older iOS, Android and web draw it with `SymbolView`, and Windows with a
   Segoe glyph. Worth knowing: **the kit's `Icon` is web and Windows only** —
   native platforms have no kit icon component and use `SymbolView` — so a
   component drawn on all four needs its layout and its glyph in separate
   files.
5. ~~Match highlighting in `Menu` / `PopupMenu` (§2.4, §4.1).~~ **Done, web
   only** — and that is not a shortcut. The filter can only be marked where the
   kit draws the menu itself. On Android and Windows the menu is the platform's
   own flyout taking plain label strings, and on iOS the `Menu` is SwiftUI's;
   there is nowhere to put a run. `PopupMenu` on iOS draws its own rows and
   could take nested `Text`, which is the one place left if it is ever wanted.
6. ~~The one-liners: `DropdownMenu.shadowElevation`, iOS `Toolbar`.~~
   **Reclassified — neither is a one-liner, and one should not be done at all.**

   `shadowElevation` has no purpose here. The Android menu uses Material 3's
   own `MenuDefaults.ShadowElevation`, which is the correct native behaviour;
   setting it to anything else would make Android *less* like its platform, not
   more. Do it only if a design calls for it.

   The iOS `Toolbar` is wave-2 work, not a missing file. `@expo/ui`'s
   `Toolbar` **wraps the view it belongs to** and fills that view's toolbar —
   its own example puts it inside a `NavigationStack`. The kit's `Toolbar` is
   a free-standing bar along a canvas with `placement: 'top' | 'bottom'`,
   holding arbitrary kit controls. Adopting SwiftUI's would mean the screen
   sitting in a SwiftUI `NavigationStack` (ours is expo-router's native stack),
   items becoming SwiftUI views rather than kit children, and `placement`
   becoming SwiftUI's enum. That is the same trade-off §2.1 already records for
   `CommandBar` on Windows, and it belongs beside it in wave 2. Note that the
   *controls* in the bar are already native — only the bar itself is drawn,
   which is right for a bar SwiftUI has no concept of.
7. ~~The cheap semantics of §6.4.~~ **Done in part: headings.** Every title on
   web was a bare `<span>`, so a page had **no headings at all** and nothing
   for a screen reader to navigate by; the title variants now carry
   `role="heading"` with a level on web and `accessibilityRole="header"` on
   the other three, with `level` to override and `level={false}` for a number
   set large. The role goes on the same element rather than swapping in an
   `<h1>`, which would bring a UA margin and a block box with it.

   Still open from §6.4: iOS `accessibilityInputLabels`, and the Windows
   automation properties beyond `AutomationId` and the heading role. Android
   remains blocked — `@expo/ui`'s Compose layer exposes no modifier for a
   content description, only `Icon` takes one as a prop.

**Wave 2 — new islands, real work.**

8. ~~`Popover` → `TeachingTip`, plus `preferredEdge`, and `trigger` on
   `ContextMenu`~~ **— done.** `trigger` came out `'tap' | 'longPress'`
   rather than the three values planned; §2.2 has why, and the short version
   is that `doubleTap` would have been a gesture the kit timed on two
   platforms and could not have at all on a third. One trap: a `TeachingTip` is a
   control **in the tree**, not a flyout that opens its own window, and it is
   confined to its `XamlRoot` by default — which here is an island a few points
   across, so it was clipped away to nothing and rendered invisibly.
   `ShouldConstrainToRootBounds(false)` puts it in a window of its own, which
   is how the `Flyout` it replaced behaved.
9. ~~`Toolbar` → `CommandBar` (§2.1).~~ **Done.** The mechanism is a
   `commands` prop that describes the bar as data, which is what a platform's
   own bar needs — `CommandBar` builds its own buttons, decides which fit, and
   draws the overflow itself. It replaces `leading`/`trailing`, and a `field`
   sends the bar back to the drawn path. One fidelity trap: a `CommandBar`
   only shows labels placed *underneath* once the bar is **open**, so
   `DefaultLabelPosition::Bottom` on a closed bar is a row of unlabelled
   glyphs; `Right` is the setting that labels a closed bar.
10. ~~Search field (§1.5) — and with it, the combobox question in §6.3.~~
    **Done.** The combobox question was decided by using the browser's: web is
    `<input type="search">` with a `<datalist>`, so the APG's hardest keyboard
    pattern is the platform's problem, and §6.3's no-dependency decision
    stands. Windows is a real `AutoSuggestBox`. **Android is composed, not
    native** — Compose's `SearchBar` and `DockedSearchBar` take an
    `onQueryChange` and no `query`, so a controlled field cannot be built on
    them, and a `value` that silently does nothing on one platform is the
    failure this kit exists to avoid. So §1.5's matrix is one native platform,
    not two.
11. ~~Materials on `Surface`, `Sheet` and `Popover` (§3.2).~~ **Done for
    `Sheet`; `Surface` and `Popover` are not doable and should not be tried
    again without a dependency.**

    `Sheet` gained `material`: SwiftUI's real material through
    `presentationBackground` on iOS, `backdrop-filter` on web. Android stays
    opaque — Compose's `ModalBottomSheet` takes a `containerColor` and
    nothing else — and so does Windows, where the sheet is drawn in a React
    Native layer because its content is React Native's.

    §3.2 was too optimistic about the other two, and the reason is structural
    rather than a missing API: **`Surface` and `Popover` are React Native
    views on every platform**, and neither SwiftUI's `background` modifier
    nor a WinUI `AcrylicBrush` can reach one. Giving them a material needs
    either `expo-blur` or an island per surface, and an island would take the
    pointer input of whatever it covers (see `.claude/rules/windows.md`). The
    same limit bit `Sheet` on web from the other side: `@expo/ui` renders
    vaul in a portal and forwards only the props it names, so the blur radius
    has to arrive as a custom property on the root.

    **Open question, raised 2026-09-19 and not decided: a `native` prop.**
    Could `Surface` (and `Popover`, and `Sheet`) take a `native` flag that
    makes the component a native view able to carry a material, on the
    condition that only native children go inside it? The vocabulary already
    exists — `Screen` has exactly this prop, documented as "whether to expect
    an @expo/ui or normal RN component children" — and the analysis came out
    like this:

    - **iOS: yes, cleanly.** `background(style, shape)` takes a material *and*
      a shape, so `Surface`'s radius comes along:
      `background({type: 'material', material: 'thin'}, shapes.roundedRectangle({cornerRadius: 12}))`.
      `NativeHostContext` already tracks whether the tree is inside a host, so
      a native `Surface` under a native `Screen` would reuse the ambient one
      rather than nesting a second.
    - **Web: yes, and the prop is inert there.** `backdrop-filter` applies to
      the kit's own element whatever the children are.
    - **Windows: the constraint solves the objection above, and replaces it
      with an unknown.** If `native` means the children are themselves islands
      plus inert React Native text, a background island underneath has no
      React Native pressable to steal input from. What is *not* known is
      whether a XAML `AcrylicBrush` inside a separate `ContentIsland` can
      sample RNW's composition content behind it — in-app acrylic samples the
      app's own content, and an island is a different content root, so it may
      sample nothing and come out black. Not answerable by reading; it needs a
      spike that is allowed to come back negative.
    - **Android: no.** `@expo/ui`'s Compose layer exposes no backdrop blur at
      all. `Modifier.blur` blurs a view's own content rather than what is
      behind it, and Android's real backdrop API
      (`Window.setBackgroundBlurRadius`) is window-level and not surfaced.

    So the prop would be native on iOS and web, possibly Windows, never
    Android. The cost against that: `Surface` is the kit's most-used
    primitive — `Toolbar`, `ListItem`, `FieldGroup`, `EmptyState` and
    `Popover` all sit on it — and a mode where children must be native is a
    real API split to buy a visual effect.

    **Free either way, and worth doing on its own:** `Popover` on Windows
    without children is already a `TeachingTip`, a real XAML control, so it
    could take an acrylic background with no API change at all.

    **Chased down 2026-09-20 in §3.6, and still closed.** The objection above
    — that an island would take the pointer input of whatever it covers — has
    a way around it on paper: a portal contains its children rather than
    covering them. Run, that portal connects inside the island and is even
    reported to UI Automation, and draws nothing. The limit is in
    react-native-windows' fragment path rather than in XAML, which makes it
    something upstream could remove; until it does, this stays closed, and the
    acrylic-sampling unknown was never reached.

**Wave 3 — decide the shape before writing code.**

12. Swipe actions (§1.6) — asymmetric platform support.
13. ~~Pull to refresh (§1.3).~~ **Closed without building, for three reasons
    that each hold on their own.**

    **React Native already provides it**, natively, on the platforms that have
    one: `RefreshControl` is `UIRefreshControl` on iOS and
    `SwipeRefreshLayout` on Android. A kit wrapper would add nothing and hide
    the real API behind a worse one.

    **The two platforms without it cannot be given it.** `RefreshControl.windows.js`
    has a `Platform.OS === 'windows'` branch, but nothing in
    `Microsoft.ReactNative` implements the view it renders — only the codegen
    descriptors exist — so it is a JavaScript path with no native side. (Not
    proven by running it; proven by the absence of an implementation, which is
    worth re-checking before trusting.) A WinUI `RefreshContainer` cannot
    stand in, because it refreshes *XAML* content and the scroller here is
    React Native's — the same limit as §1.6 and §3.2. On web,
    react-native-web's `RefreshControl` is inert and the DOM has no
    pull-to-refresh primitive at all.

    **And the kit owns no scrollable for it to live on.** Lists are
    deliberately React Native's here (see "Deliberately not doing"), so there
    is no component of the kit's for the prop to belong to.
14. `TabView` (§2.5), ~~`ShareLink` (§1.7)~~, `Chip` (§1.4), pager (§1.8).

    **`ShareLink` is done, with one honest hole.** iOS is SwiftUI's own
    `ShareLink`, Android is React Native's `Share` (an `ACTION_SEND` intent)
    and web is the same API through react-native-web's `navigator.share` — all
    three native, none needing a new dependency. Windows needed the kit's
    *first native module* (`windows/ExpoInterface/Share.cpp`, over
    `DataTransferManager`) because React Native's `Share` **only dispatches on
    `ios` and `android`** — on any other platform its JavaScript does nothing.

    **The Windows path is now seen working, and the reason it appeared not to
    be is worth more than the fix.** The sheet opens over the app's own window
    in an unpackaged Release build, with the link, its QR code and the share
    targets, and the window goes modal behind it — package identity, the first
    suspect, is not needed. What was wrong was the *harness*: the Windows apps
    hold a **copy** of `expo-interface` in their `node_modules`, `src/` and
    `windows/` alike, and the solution compiles that copy's C++ rather than the
    repository's. A copy two days old has neither the new JavaScript nor the
    new island, so a component comes out `undefined` and a module is simply
    absent — and nothing says so. Sync both directories before believing
    anything a Windows run appears to show.

    **The pager is done, and §1.8's matrix is corrected there.** It came out
    the opposite of what was planned: the *scroller* is the platform's own on
    all four, because React Native's `pagingEnabled` already is each of them,
    while the native *controls* the plan named — `FlipView`, Compose's
    `HorizontalPager`, SwiftUI's paged `TabView` — are all unreachable for the
    same reason, which is that their pages would have to be React Native
    content hosted inside a container built around a drag. The one platform
    control that fits is the indicator, `PipsPager`, and it fits because it
    has no children at all.

    **`Chip` is done, and it did not fail the bar after all** — §1.4 has the
    corrected matrix. Counting native platforms by whether a control is
    *called* a chip gives one; counting by whether the platform has a control
    for a capsule that stays pressed gives four, and the second is the
    question that matters, because that control is what carries the state to a
    screen reader.

    **`TabView` is done, and it is the one item built against this
    document's own two-platform bar.** It is a new component — document tabs,
    not the navigation tabs `src/tabs` already is — with a real WinUI 3
    `TabView` for the strip on Windows and a drawn strip on the other three,
    falling to a count button over a grid of cards under 640 points
    everywhere. Only Windows has a control, and unlike `Chip` that is not a
    miscount: iOS's `TabView` and Compose's `TabRow` are both the navigation
    kind. What justifies it is in §2.5 — three of the four still get the shape
    their own platform teaches, which is what the bar was a proxy for.

    The Windows half is the strip **alone**: items with no content, sized to
    the header height, with the page drawn under the island by React Native —
    the fallback §3.6 left standing, and it works. Reordering is off until
    there is an `onReorder` to answer a drag with.

    The finding worth carrying out of it is about web rather than Windows: a
    tab strip **cannot** have a second announced control per tab, because ARIA
    makes a tab's children presentational and forbids a button among a
    tablist's. The cross is a pointer affordance there and the keyboard closes
    with Delete, said out loud by `aria-keyshortcuts`. The native platforms
    have no such rule and keep the real button.
15. ~~Caret-anchored `PopupMenu` (§4.2) — web-only, or commit to two native
    modules.~~ **Done, web only, deliberately.** `caretPoint(field, within)` in
    `src/caret`; the other three answer `null` and name the module each would
    need. It is a function rather than the hook the plan guessed, because
    there is nothing to remember between calls. The `SlashCommand` story is
    the whole thread of this document in one frame: `/h` typed into a field
    opens the menu at the caret, filtered by what follows the slash, with the
    match highlighted by the Custom Highlight API from §4.1.

Each item is one directory, a file per platform, stories, tests to 100 %, and a
harness run on web and on Windows before it counts as done.

---

## 8. Still open

Everything the fifteen items above asked for is done or closed with a reason.
What remains is this, and it is worth keeping in one place rather than leaving
it scattered through the sections that finished around it.

**Nothing is outstanding inside the fifteen items.** Item 7's accessibility
tail was the last of it and is done as far as the platforms allow — §6.4 has
what was set, what the harness now shows, and the two properties
react-native-windows cannot answer from JavaScript at all (`IsDialog`,
`LandmarkType`). Two things stay closed with reasons rather than work: Android
has no Compose modifier for a content description (`@expo/ui` exposes one only
as a prop on `Icon`), and iOS's `accessibilityInputLabels` needs an app's own
vocabulary rather than a kit prop.

**Both open questions are now decided, and both came out "no".**

- **§2.6, `Icon` on Windows — not taking `PathIcon` / `ImageIcon`.** The gap is
  real: `SEGOE_GLYPHS` plus `FontIcon` limits the kit to glyphs Segoe Fluent
  happens to have, and it bites in practice, because a generated map has to
  cover every Material name in `src/` — a story using `sticky_note_2` fails
  the suite. But the fix is **to widen the mapping toward full coverage**,
  which is cheap per name and needs no new spec, no C++ and no second drawing
  path. Decided 2026-09-20.
- **§4.4, the DOM `TextField` — leaving it.** See that section: nothing is
  broken, and the three components that *are* real DOM are all floating UI,
  where the platform gives something React Native cannot. A text input has no
  equivalent prize.

**One watch and one thing to file.**

- **§5.1.** Windows App SDK 1.8 left servicing on 2026-09-09. The kit is on it
  transitively through react-native-windows 0.84 and cannot move ahead of
  them. Track their bump.
- **The react-native-windows issue §3.6 identified**: a public way to size a
  fragment island, or a `CreatePortal` that parents its content after the
  island's root visual exists. Filing it is what would reopen swipe actions on
  Windows (§1.6), materials behind React Native children (§3.2, item 11), and
  a `TabView` whose items hold their own pages (§2.5).
