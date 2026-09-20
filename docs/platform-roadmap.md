# Platform roadmap

What each platform can still do that the kit does not yet ask of it, and the
order to do it in. Written 2026-09-19 against Expo SDK 57 / React Native 0.86.3
/ `@expo/ui` 57.0.18 / react-native-windows 0.84 / Windows App SDK 1.8.

**Progress.** Wave 1 is done, except that item 6 turned out not to be what it
said — see below. **Waves 1 and 2 are done.** Wave 3: item 12 done, item 13 closed without
building, `ShareLink` done out of item 14 (Windows unverified); the rest of 14
and item 15 outstanding.

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

| | control |
| --- | --- |
| Android | **native** — Compose `Chip` (assist, filter, input, suggestion) |
| iOS | **composed** — `Button` with `buttonBorderShape('capsule')` |
| Windows | **composed** — `Surface` pill |
| Web | **composed** — DOM |

The Community Toolkit's `TokenView` would be the Windows answer, but see §5.3.

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
an island cannot hold React Native children.

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
island holds XAML, and the pages here are React Native's. Nor can Compose's
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
- **`trigger: 'tap' | 'longPress' | 'doubleTap'`** on `ContextMenu`, which
  currently hardcodes right-click plus a 500 ms touch long-press.

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

### 2.5 `Tabs` on Windows

`src/tabs` maps to `NavigationView` (app areas) and `SelectorBar` (inline).
There is a third Windows idiom it does not reach: **`TabView`** — closeable,
reorderable, tear-off document tabs with an add button and a strip footer.
That is what `TabStack` wants on a desktop.

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

### 4.2 Caret-anchored `PopupMenu` — finish the design

`PopupMenuProps` already documents "the caret in an editor" and "a menu typed
into (a slash command)", and already takes `at: MenuPoint | null` and `filter`.
Nothing in the repository can produce that caret point.

A `useCaretPoint()` hook would close it, on web via the hidden mirror-div
measurement `rich-input` falls back to. React Native exposes no caret rectangle,
so iOS would need `UITextInput.caretRect(for:)` and Android
`Layout.getPrimaryHorizontal` behind a module. **Scope it web-only and say so**,
or decide deliberately to write the two native modules.

### 4.3 Not taking

OpaqueRange (Chromium 152+, experimental, no Safari or Firefox), and
`ElementInternals`, `::part()` and `<datalist>`, which solve the
custom-element packaging problem a React kit does not have. Their popover
placement is `popover` plus anchor positioning with try-fallbacks, which
`src/menu/menu.css` already ships, alongside feature-detected `interestfor` in
`src/tooltip`.

### 4.4 An open question: a DOM `TextField`

`src/text-field/index.tsx` is react-native-web's `TextInput`, while `Menu`,
`ContextMenu` and `Tooltip` are real DOM with their own CSS. Moving it would be
consistent and would help §1.5, but it is a behaviour-compatibility risk
against the whole RN `TextInput` prop surface. Decide it on purpose, in its own
session, or leave it.

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
| Windows | Name only | AutomationId, HelpText, HeadingLevel, LandmarkType, LiveSetting, PositionInSet / SizeOfSet, IsDialog — §3.1 |
| Web | roles and labels are good | the keyboard patterns in §6.1 |

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

8. ~~`Popover` → `TeachingTip`, plus `preferredEdge`~~ **— done.** `trigger`
   on `ContextMenu` is still outstanding. One trap: a `TeachingTip` is a
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

    **The Windows path has not been seen working.** It builds, it registers,
    the button presses — and no sheet appeared in an unpackaged Release build,
    with nothing logged. The cause was not determined. Rule out package
    identity first: it is what stops other Windows APIs in this same harness.
    Every failure resolves `false` so an app hears that no sheet opened, which
    is a graceful answer to an unexplained problem rather than evidence about
    it.

    **The pager is done, and §1.8's matrix is corrected there.** It came out
    the opposite of what was planned: the *scroller* is the platform's own on
    all four, because React Native's `pagingEnabled` already is each of them,
    while the native *controls* the plan named — `FlipView`, Compose's
    `HorizontalPager`, SwiftUI's paged `TabView` — are all unreachable for the
    same reason, which is that their pages would have to be React Native
    content hosted inside a container built around a drag. The one platform
    control that fits is the indicator, `PipsPager`, and it fits because it
    has no children at all.

    Still outstanding from this item: `Chip` is **one** native platform
    (Compose's four chip kinds) and so fails this document's own two-platform
    bar; `TabView` is Windows only.
15. Caret-anchored `PopupMenu` (§4.2) — web-only, or commit to two native
    modules.

Each item is one directory, a file per platform, stories, tests to 100 %, and a
harness run on web and on Windows before it counts as done.
