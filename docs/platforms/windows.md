# Windows

[Docs home](../README.md)

On Windows the kit draws WinUI 3 controls in an app built with
[expo-windows](https://github.com/kat-tax/expo-windows), which is the platform
itself: the Metro config, the Expo SDK on Windows, and the CLI that writes,
builds and packages the app. Start with
[its quick start](https://github.com/kat-tax/expo-windows#quick-start). The
kit's native library is autolinked into that app, and nothing else is needed.

## Setting up

1. Add the platform with `expo-windows`: install it, apply `withWindows` in
   `metro.config.js`, and run `npx expo-windows init`.
2. Use the kit's `Stack`, `Tabs` and `TabStack` in your layouts, as
   [Getting started](../getting-started.md) shows. `react-native-screens` draws
   nothing on Windows, so the kit's `Stack` is what gives a screen its header.
3. Run `npx expo-windows run`.

Both packages have to be in the app's `dependencies`. That is how autolinking
finds the kit's library, `windows/ExpoInterface`, and how the runtime finds the
kit's aliases for `@expo/ui`. The codegen headers for the kit's specs ship with
the package, so the app's build needs no codegen step.

Expo SDK 57 pins React Native 0.86, and react-native-windows' newest line is
0.84. See
[expo-windows' versions page](https://github.com/kat-tax/expo-windows/blob/master/docs/versions.md)
for what that means for an app today.

## What is different at a desk

| Feature | What you do |
| --- | --- |
| Content in the title bar | `useWindowChrome({extend: true})` in the root layout. See [The window](#the-window). |
| Keyboard shortcuts | `shortcut` on a menu item, or `useKeyboardShortcut`. See [Keyboard](#keyboard). |
| A navigation pane | `windowsPane` on `Tabs`. See [Tabs](../components/navigation.md#tabs). |
| High contrast | Nothing. The theme follows it. See [Theming](../theming.md#high-contrast). |
| Right to left, display scaling | Nothing. See [Right to left and scaling](#right-to-left-and-scaling). |
| `@expo/ui` screens you already have | Nothing. They draw WinUI controls. See [Standing in for `@expo/ui`](#standing-in-for-expoui). |

## Islands

Each kit control with a WinUI counterpart is a Fabric native component from
`windows/ExpoInterface`, hosting the control in a XAML island, themed by
Fluent and branded from the accent seed. The island reports the size its
control wants to Yoga, so a button hugs its content unless a style stretches
it. Props reach the control in `UpdateProps`; events come back through the
codegen emitter. The specs in `src/windows/specs/` are the contract, and
`bun run codegen:windows` regenerates the headers after a spec change.

| Island | WinUI control | Used by |
| --- | --- | --- |
| `ExpoInterfaceButton` | `Button` | `Button`, `Menu`'s trigger, `HeaderAction`, `ShareLink`, `Chip` (action) |
| `ExpoInterfaceToggleSwitch` | `ToggleSwitch` | `Switch` |
| `ExpoInterfaceCheckBox` | `CheckBox` | `Checkbox` |
| `ExpoInterfaceToggleButton` | `ToggleButton` with a `FontIcon` | `IconToggle` |
| `ExpoInterfaceChip` | `ToggleButton` with a pill radius | `Chip` (filter) |
| `ExpoInterfaceProgress` | `ProgressBar`, `ProgressRing` | `Progress`, `Spinner`, `Gauge` rings |
| `ExpoInterfacePersonPicture` | `PersonPicture` | `Avatar` |
| `ExpoInterfaceInfoBadge` | `InfoBadge` | `Badge` |
| `ExpoInterfacePipsPager` | `PipsPager` | `Pager` |
| `ExpoInterfaceSlider` | `Slider` | `Slider` |
| `ExpoInterfaceNumberBox` | `NumberBox` | `Stepper` |
| `ExpoInterfaceComboBox` | `ComboBox` | `Picker` |
| `ExpoInterfaceSelectorBar` | `SelectorBar` | `SegmentedControl` |
| `ExpoInterfaceDatePicker`, `ExpoInterfaceTimePicker` | `CalendarDatePicker`, `TimePicker` | `DateTimePicker` |
| `ExpoInterfaceTextBox` | `TextBox`, `PasswordBox` | `TextField` |
| `ExpoInterfaceColorPicker` | `ColorPicker` in a `Flyout` | `ColorPicker` |
| `ExpoInterfaceAutoSuggestBox` | `AutoSuggestBox` | `SearchField` |
| `ExpoInterfaceMenuFlyout` | `MenuFlyout` | `Menu`, `ContextMenu`, `PopupMenu`, `Fab`, `HeaderMenu` |
| `ExpoInterfaceContentDialog` | `ContentDialog`'s arrangement in a windowed popup | `Alert` |
| `ExpoInterfaceTeachingTip` | `TeachingTip` | `Popover` |
| `ExpoInterfaceCommandBar` | `CommandBar` | `Toolbar` |
| `ExpoInterfaceInfoBar` | `InfoBar` | `Toast` |
| `ExpoInterfaceNavigationView` | `NavigationView` | `Tabs` |
| `ExpoInterfaceTabView` | `TabView` | `TabView` |

The library also holds one native module, `ExpoInterfaceShare`, over
`DataTransferManager` for `ShareLink`.

What has no WinUI control is drawn with Fluent metrics in Segoe UI Variable:
`Screen`, `ScreenHeader`, `Surface`, `Card`, `ListItem`, `FieldGroup`,
`Collapsible`, `Divider`, `EmptyState`, `Typography`, `Fab`, `KeyboardBar`,
`Sheet`, the stack's header and modals, the pager's scroller, the tab
switcher, the color picker's swatches and the gauge's bars. The drawn
pressables behave as WinUI's own controls do at a desk: the state fills under
the pointer and while pressed, the focus ring when tabbed to, Enter and Space
to press.

Two facts about islands shape the kit's Windows files:

- An island takes pointer input for itself whatever React Native's
  `pointerEvents` says. The kit's menu islands are therefore a one-pixel strip
  along the trigger's edge or a one-point anchor, never laid over the trigger.
- An island holds XAML. A control that wraps content (`Expander`,
  `SwipeControl`, `TabView` items, `Flyout` content) cannot hold the kit's
  React Native content, so those components draw the content beside or under
  the island instead.

Menus, dropdowns, the popover and the alert open as windowed popups, which is
why they can extend past their island.

## The window

With `expo-windows`, `useWindowChrome({extend: true})` in the root layout
extends the content into the title bar: no system title, the caption buttons
drawn for the scheme over the app's own top row, and the root `Stack`'s
header as the region that drags the window, leaving the caption buttons
their room. With that header hidden nothing drags the window. There is no
Mica or acrylic backdrop behind the content: a Win32 window on the Windows
App SDK's composition islands has no backdrop target in this release.

```tsx
// app/_layout.tsx
import {Stack, useWindowChrome} from 'expo-interface';

export default function Layout() {
  useWindowChrome({extend: true});
  return <Stack/>;
}
```

On iOS, Android and web the hook does nothing, so the layout needs no branch.

The kit's `Stack` names the window after the focused screen, in the form
"Settings – My App".

A header of your own can be the drag region: `ScreenHeader`'s `dragRegion`
prop makes its row drag the window while the content is in the title bar.

## Keyboard

A menu item's `shortcut` is drawn beside its label as WinUI draws an
accelerator and bound wherever the focus is while the menu is mounted.
`useKeyboardShortcut('Ctrl+K', handler)` binds one from any screen. The keys
reach the kit's `Stack` from the focused control, and of two bindings to one
shortcut the later mounted wins, so a screen's is in front of its layout's.
On the other platforms the hook binds nothing and the shortcut text is not
drawn.

```tsx
useKeyboardShortcut('Ctrl+K', openSearch);
useKeyboardShortcut('Ctrl+S', save, dirty);   // bound only while `dirty`

<Menu label="File" items={[
  {label: 'Save', shortcut: 'Ctrl+S', onPress: save},
  {label: 'Rename', shortcut: 'F2', onPress: rename},
]}/>
```

A shortcut is modifiers and a key joined by `+`: `Ctrl`, `Shift`, `Alt` and
`Win`, then a letter, a digit, a function key, or a name such as `Left`, `Esc`,
`Enter`, `Space`, `Tab`, `Delete` or `Backspace`. Passing `null` binds nothing.

`ContextMenu` opens on the Menu key and Shift+F10 as well as a right click.
Alt+Left, the keyboard's back key and the mouse's back button pop the stack;
Escape closes the topmost modal.

The touch keyboard reaches React Native's `Keyboard` through `expo-windows`,
and `KeyboardBar` rides up to meet it.

## Right to left and scaling

Right to left follows the window, as for every Win32 window under an RTL
language: react-native-windows mirrors its layout, and the kit sets the same
flow direction on every island's root, which XAML does not inherit. The
caption buttons then sit on the left, and the headers and the top tab bar
leave them their room on that side. `I18nManager.forceRTL` alone mirrors
nothing on this renderer, and text keeps starting at the left under RTL
unless given an `align`.

Scaling is in points throughout: at 125% the drawn parts and the islands grow
together, and the drag region, the title bar insets and the keyboard's
rectangle are converted by the window's scale. `useWindowDimensions` reports
the window's physical size at a scale of 1 and never updates on a resize; the
kit measures its own layouts with `onLayout`, and an app should too.

## Standing in for `@expo/ui`

`@expo/ui` has no Windows implementation, and neither have the community
controls it wraps. On `expo-windows` the kit answers for them, so a screen
written against those packages draws WinUI controls without a change. The
files are in `src/windows/aliases/`, and the table beside them,
`aliases.json`, names a file for each module. The kit's `package.json` points
the runtime at the table:

```json
"expo-windows": {"aliases": "./src/windows/aliases/aliases.json"}
```

`withWindows` reads that field from the app's dependencies, so an app that
depends on the kit needs no setup of its own. Only a `windows` bundle is
affected.

| Module | On Windows |
| --- | --- |
| `@expo/ui` | The universal entry over the kit: `Button`, `Switch`, `Slider`, `Checkbox`, `Picker` (segmented by `appearance`), `TextInput`, `BottomSheet`, `Collapsible`, `FieldGroup`, `ListItem`, `Icon` as a Segoe glyph, `useNativeState`. The layout primitives (`Host`, `Column`, `Row`, `Spacer`, `Text`, `List`, `ScrollView`, `RNHostView`) are plain views laid out as they ask. |
| `@expo/ui/swift-ui`, `@expo/ui/jetpack-compose` | Every export of both subpaths and of their `modifiers`. The controls are the kit's WinUI islands; the stacks, rows, columns and boxes are flex views; the layout modifiers (`frame`, `padding`, `size`, `fillMax*`, `cornerRadius`, `opacity`, `hidden`, `offset`, `zIndex`, `background`, `border`, `weight`) become styles and `onTapGesture` and `clickable` a press. SwiftUI's `NavigationStack`, `NavigationLink`, `NavigationDestination` and `Toolbar` are plain containers, since navigation is Expo Router's. Other modifiers are kept without effect. What a desktop has no counterpart for (charts, widgets, swipe actions) renders nothing and says so once in development. |
| `@expo/ui/community/*` and the packages they wrap | The kit's `Slider`, `Picker`, `DateTimePicker`, `SegmentedControl`, `Sheet` and `ContextMenu` under each package's props and default export. The pager is a paging scroll view with the ref and page events; the masked view shows its content whole. The packages' own Windows ports are for the old architecture. |
| `expo-checkbox` | The kit's `Checkbox` under the package's props. |

The wrapped packages are `@react-native-community/slider`,
`@react-native-picker/picker`, `@react-native-community/datetimepicker`,
`@react-native-segmented-control/segmented-control`,
`react-native-pager-view`, `@react-native-masked-view/masked-view`,
`@gorhom/bottom-sheet` and `@react-native-menu/menu`.
