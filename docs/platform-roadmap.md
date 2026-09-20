# Platform roadmap

What each platform can still do that the kit does not yet ask of it, and the
order to do it in. Written 2026-09-19 against Expo SDK 57 / React Native 0.86.3
/ `@expo/ui` 57.0.18 / react-native-windows 0.84 / Windows App SDK 1.8.

This is a plan for a later session. Nothing here is started.

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

The strongest candidate in this document: every platform has a real control.

| | control |
| --- | --- |
| iOS | **native** — `badge` / `badgeProminence` modifiers |
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
| Windows | **native** — WinUI `SwipeControl` |
| Android | **none** — `@expo/ui` ships no Compose equivalent |
| Web | **composed** — pointer drag |

Asymmetric. `ListItem` already takes an `action`, so the honest shape is: swipe
where the platform swipes, and fall back to that trailing action elsewhere.

### 1.7 `ShareLink`

| | control |
| --- | --- |
| iOS | **native** — `ShareLink` (`item`, `getItemAsync`, `subject`, `preview`) |
| Windows | **native** — `Sharing.cpp` already wraps `DataTransferManager` |
| Android | **native** — `expo-sharing` / the share intent |
| Web | **composed** — `navigator.share`, falling back to copy-link |

### 1.8 Pager

| | control |
| --- | --- |
| Android | **native** — `HorizontalPager` / `Carousel` |
| iOS | **native** — `TabView` in its page style |
| Windows | **native** — WinUI `FlipView` + `PipsPager` |
| Web | **composed** — scroll-snap (check CSS carousel primitives' status) |

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

## 6. Order

**Wave 1 — self-contained, native nearly everywhere, no new dependencies.**

1. `AutomationId` from `testID`, and `by.testID()` in the harness (§3.1). Do
   this first; it makes everything after it easier to test.
2. `Badge` (§1.1).
3. Empty state (§1.2).
4. Match highlighting in `Menu` / `PopupMenu` (§2.4, §4.1).
5. The one-liners: `DropdownMenu.shadowElevation`, iOS `Toolbar` (§2.1, §2.3).

**Wave 2 — new islands, real work.**

6. `Popover` → `TeachingTip`, plus `preferredEdge` and `trigger` (§2.2).
7. `Toolbar` → `CommandBar` (§2.1).
8. Search field (§1.5).
9. Materials on `Surface`, `Sheet` and `Popover` (§3.2).

**Wave 3 — decide the shape before writing code.**

10. Swipe actions (§1.6) — asymmetric platform support.
11. Pull to refresh (§1.3) — the island-versus-scroller conflict.
12. `TabView` (§2.5), `Chip` (§1.4), `ShareLink` (§1.7), pager (§1.8).
13. Caret-anchored `PopupMenu` (§4.2) — web-only, or commit to two native
    modules.

Each item is one directory, a file per platform, stories, tests to 100 %, and a
harness run on web and on Windows before it counts as done.
