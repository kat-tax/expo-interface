# Components

[Docs home](../README.md)

Everything is exported from `expo-interface`. Each component renders the
platform's own control where the platform has one, and is drawn with that
platform's metrics where it does not. Each entry says which.

Value controls are controlled: `value` pairs with `onValueChange`.

See them live in the [Storybook](https://kat-tax.github.io/expo-interface/).

## Layout

| Component | What it is |
| --- | --- |
| [`Screen`](layout.md#screen) | The root of a route: background, safe areas, status bar, maximum width, a slot for a floating action button. |
| [`ScreenHeader`](layout.md#screenheader) | A header bar for a screen that draws its own. |
| [`NativeHost`](layout.md#nativehost) | A native host around a group of controls. |
| [`Surface`](layout.md#surface) | A box in the theme's colors, pressable if you like. |
| [`Card`](layout.md#card) | A pressable surface with header, body, footer, overlay and badge slots. |
| [`Toolbar`](layout.md#toolbar) | A bar of tools along a canvas. |
| [`KeyboardBar`](layout.md#keyboardbar) | A bottom bar that sticks to the keyboard. |
| [`FieldGroup`](layout.md#fieldgroup) | A scrollable settings form of titled sections. |
| [`ListItem`](layout.md#listitem) | A settings-style row with slots, an action and swipe actions. |
| [`Collapsible`](layout.md#collapsible) | A header that shows or hides its content. |
| [`Divider`](layout.md#divider) | A hairline separator. |
| [`EmptyState`](layout.md#emptystate) | What a screen shows when it has nothing to show. |

## Navigation

| Component | What it is |
| --- | --- |
| [`Stack`](navigation.md#stack) | Expo Router's native stack, and a stack of the kit's own on Windows. |
| [`Tabs`](navigation.md#tabs) | The app's section tabs. |
| [`TabStack`](navigation.md#tabstack) | The stack inside a tab, with the platform's header. |
| [`ConstrainedStackHeader`](navigation.md#constrainedstackheader) | The web stack header, matched to the content's width. |
| [`TabView`](navigation.md#tabview) | Document tabs the user opens and closes. |
| [`Pager`](navigation.md#pager) | Full-width pages that snap, with an indicator. |
| [`HeaderMenu`, `HeaderAction`, `HeaderActions`](navigation.md#headermenu-headeraction-headeractions) | Controls for a stack header's trailing slot. |
| [`ExternalLink`](navigation.md#externallink) | A link to a URL outside the app. |
| [`ShareLink`](navigation.md#sharelink) | A button that opens the platform's share sheet. |

## Controls

| Component | What it is |
| --- | --- |
| [`Button`](controls.md#button) | Filled, outlined or text, with icons, sizes and shapes. |
| [`Fab`](controls.md#fab) | A floating action button, optionally opening a menu. |
| [`Chip`](controls.md#chip) | A filter that can be off, or an action. |
| [`IconToggle`](controls.md#icontoggle) | A round icon button with two states. |
| [`Switch`](controls.md#switch) | An on/off toggle with a label. |
| [`Checkbox`](controls.md#checkbox) | A checked or unchecked box with a label. |
| [`TextField`](controls.md#textfield) | A single or multi-line text input. |
| [`SearchField`](controls.md#searchfield) | A query box with a clear button and completions. |
| [`Picker`](controls.md#picker) | A dropdown that selects one option. |
| [`SegmentedControl`](controls.md#segmentedcontrol) | A row of segments that selects one option. |
| [`Slider`](controls.md#slider) | A thumb along a continuous or stepped range. |
| [`Stepper`](controls.md#stepper) | A number with increment and decrement buttons. |
| [`DateTimePicker`](controls.md#datetimepicker) | A date, a time or both. |
| [`ColorPicker`](controls.md#colorpicker) | A color well that opens a picker, with swatches. |

## Indicators

| Component | What it is |
| --- | --- |
| [`Progress`](indicators.md#progress) | A linear bar or a circular ring, determinate or not. |
| [`Spinner`](indicators.md#spinner) | The platform's activity indicator. |
| [`Gauge`](indicators.md#gauge) | A value within a range, in the SwiftUI gauge styles. |
| [`Badge`](indicators.md#badge) | A count or a dot. |
| [`Avatar`](indicators.md#avatar) | A person as a colored circle with initials. |
| [`Typography`](indicators.md#typography) | Text in the platform's type scale, and its variants as components. |

## Overlays

| Component | What it is |
| --- | --- |
| [`Menu`](overlays.md#menu) | A dropdown menu of actions opened from a button. |
| [`ContextMenu`](overlays.md#contextmenu) | A menu opened by a long press or a right click. |
| [`PopupMenu`](overlays.md#popupmenu) | The platform's menu at a point, over content the kit did not draw. |
| [`Popover`](overlays.md#popover) | A card pointing at a rectangle. |
| [`Tooltip`](overlays.md#tooltip) | A short hint attached to a piece of content. |
| [`Alert`](overlays.md#alert) | A modal dialog or an action sheet. |
| [`Sheet`](overlays.md#sheet) | A bottom sheet that inherits the accent. |
| [`Toast`](overlays.md#toast) | A brief message over the screen. |

## Hooks and functions

| Export | What it is | Page |
| --- | --- | --- |
| `AccentProvider`, `useAccentSeed`, `onAccent`, `ACCENT_SEED` | The accent seed. | [Theming](../theming.md#accent) |
| `useColorScheme`, `setColorScheme`, `getColorSchemeMode`, `SCHEME_STORAGE_KEY` | The light or dark scheme, and forcing it. | [Theming](../theming.md#color-scheme) |
| `theme`, `useColor`, `usePalette`, `useNavTheme`, `colors`, `getThemeCSS`, `getThemeBootScript` | Reading colors. | [Theming](../theming.md#reading-colors) |
| `spacing`, `bound`, `inset`, `fonts`, `fontWeights`, `variants` | Constants. | [Theming](../theming.md#constants) |
| `useHighContrast`, `highContrastPalette` | Windows high contrast. | [Theming](../theming.md#high-contrast) |
| `icon`, `SEGOE_GLYPHS`, `windowsGlyph` | Icon tokens. | [Icons](../icons.md) |
| `useNativeHost`, `hostAccentProps`, `fillWidth` | Native hosts. | [Native hosts](../hosts.md) |
| `useWindowChrome` | Content in the Windows title bar. | [Windows](../platforms/windows.md#the-window) |
| `useKeyboardShortcut` | A keyboard shortcut on Windows. | [Windows](../platforms/windows.md#keyboard) |
| `nextSelection` | Which tab to select when one closes. | [TabView](navigation.md#tabview) |
| `caretPoint` | Where the caret is in a text field, on web. | [PopupMenu](overlays.md#popupmenu) |
