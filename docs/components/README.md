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
| [`Material`](layout.md#material) | A view on the platform's material: blur, Liquid Glass, acrylic. |
| [`Card`](layout.md#card) | A pressable surface with a picture, a title, the platform's menu, a star, and slots of the app's own. |
| [`Toolbar`](layout.md#toolbar) | A bar of tools along a canvas, or floating beside a selection. |
| [`FindBar`](layout.md#findbar) | A bar to find text: a field, the count, previous, next and close. |
| [`KeyboardBar`](layout.md#keyboardbar) | A bottom bar that sticks to the keyboard. |
| [`FieldGroup`](layout.md#fieldgroup) | A scrollable settings form of titled sections. |
| [`ListItem`](layout.md#listitem) | A settings-style row with an icon, slots, a value, a badge, an action and swipe actions. |
| [`List`](layout.md#list) | A list of rows that grows: the platform's own lazy list. |
| [`CardGrid`](layout.md#cardgrid) | A grid of cards that grows, its columns from the width. |
| [`Collapsible`](layout.md#collapsible) | A header that shows or hides its content. |
| [`Divider`](layout.md#divider) | A hairline separator. |
| [`EmptyState`](layout.md#emptystate) | What a screen shows when it has nothing to show. |

## Navigation

| Component | What it is |
| --- | --- |
| [`Stack`](navigation.md#stack) | Expo Router's native stack, and a stack of the kit's own on Windows. |
| [`Tabs`](navigation.md#tabs) | The app's section tabs. |
| [`TabStack`](navigation.md#tabstack) | The stack inside a tab, with the platform's header. |
| [`HideTabs`](navigation.md#tabs) | Hides the tabs while the screen it is in is focused. |
| [`ConstrainedStackHeader`](navigation.md#constrainedstackheader) | The web stack header, matched to the content's width. |
| [`TabView`](navigation.md#tabview) | Document tabs the user opens and closes. |
| [`Pager`](navigation.md#pager) | Full-width pages that snap, with an indicator. |
| [`HeaderMenu`, `HeaderAction`, `HeaderActions`](navigation.md#headermenu-headeraction-headeractions) | Controls for a stack header's trailing slot. |
| [`HeaderSearch`](navigation.md#headersearch) | The header's search, in the platforms' placements. |
| [`HeaderAccessory`](navigation.md#headeraccessory) | A row of the screen's own under its header, paid for in the bar's inset. |
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
| [`Composer`](controls.md#composer) | A capsule to write a message in, with a send button that stops while something runs. |
| [`SearchField`](controls.md#searchfield) | A query box with a clear button and completions. |
| [`Picker`](controls.md#picker) | A dropdown that selects one option. |
| [`SegmentedControl`](controls.md#segmentedcontrol) | A row of segments that selects one option. |
| [`Slider`](controls.md#slider) | A thumb along a continuous or stepped range. |
| [`Stepper`](controls.md#stepper) | A number with increment and decrement buttons. |
| [`DateTimePicker`](controls.md#datetimepicker) | A date, a time or both, as a row or presented from a chip. |
| [`ColorPicker`](controls.md#colorpicker) | A color well that opens a picker, inline, in a popover or a menu, with swatches and no color. |

## Indicators

| Component | What it is |
| --- | --- |
| [`Progress`](indicators.md#progress) | A linear bar or a circular ring, determinate or not. |
| [`Spinner`](indicators.md#spinner) | The platform's activity indicator. |
| [`Gauge`](indicators.md#gauge) | A value within a range, in the SwiftUI gauge styles. |
| [`Badge`](indicators.md#badge) | A count or a dot. |
| [`Avatar`](indicators.md#avatar) | A person as a colored circle with initials, a ring, dimmed when away. |
| [`AvatarGroup`](indicators.md#avatargroup) | People as overlapping faces, counted past a few, pressable. |
| [`Typography`](indicators.md#typography) | Text in the platform's type scale, and its variants as components. |
| [`RelativeTime`](indicators.md#relativetime) | A moment as the time since it, kept current. |
| [`Icon`](../icons.md#the-icon-component) | A token drawn on its own, in a tone. |

## Overlays

| Component | What it is |
| --- | --- |
| [`Menu`](overlays.md#menu) | A dropdown menu of actions opened from a button. |
| [`ContextMenu`](overlays.md#contextmenu) | A menu opened by a long press or a right click. |
| [`PopupMenu`](overlays.md#popupmenu) | The platform's menu at a point, over content the kit did not draw. |
| [`Popover`](overlays.md#popover) | A card pointing at a rectangle: modal, or kept up by the pointer. |
| [`Tooltip`](overlays.md#tooltip) | A short hint attached to a piece of content. |
| [`Alert`](overlays.md#alert) | A modal dialog or an action sheet, with a field for a prompt. |
| [`Sheet`](overlays.md#sheet) | A bottom sheet with a title bar, a cap on its height, a footer and actions. |
| [`Toast`](overlays.md#toast) | A brief message over the screen. |
| [`ToastProvider`, `useToast`](overlays.md#toast) | The app's toasts, queued and shown one at a time. |

## Hooks and functions

| Export | What it is | Page |
| --- | --- | --- |
| `AccentProvider`, `useAccentSeed`, `onAccent`, `resolveAccent`, `currentAccent`, `ACCENT_SEED`, `ACCENT_STORAGE_KEY` | The accent seed, legible in each scheme and kept on web. | [Theming](../theming.md#accent) |
| `useColorScheme`, `setColorScheme`, `getColorSchemeMode`, `restoreColorScheme`, `SCHEME_STORAGE_KEY` | The light or dark scheme, and forcing it. | [Theming](../theming.md#color-scheme) |
| `theme`, `useColor`, `usePalette`, `resolvedPalette`, `isColorToken`, `useNavTheme`, `colors`, `getThemeCSS`, `getThemeBootScript` | Reading colors. | [Theming](../theming.md#reading-colors) |
| `spacing`, `bound`, `inset`, `fonts`, `fontWeights`, `variants` | Constants. | [Theming](../theming.md#constants) |
| `useHighContrast`, `highContrastPalette` | Windows high contrast. | [Theming](../theming.md#high-contrast) |
| `icon`, `symbolName`, `materialName`, `registerDrawables`, `drawableOf`, `getSymbolFontCSS`, `SEGOE_GLYPHS`, `windowsGlyph` | Icon tokens, their names per platform, the Android drawables and the web font. | [Icons](../icons.md) |
| `useNativeHost`, `hostAccentProps`, `fillWidth` | Native hosts. | [Native hosts](../hosts.md) |
| `useWindowChrome` | Content in the Windows title bar. | [Windows](../platforms/windows.md#the-window) |
| `useKeyboardShortcut` | A keyboard shortcut on Windows. | [Windows](../platforms/windows.md#keyboard) |
| `nextSelection` | Which tab to select when one closes. | [TabView](navigation.md#tabview) |
| `useScrollInsets` | The insets a screen's scroll content pays for a bar it passes under, plus its own. | [Screen](layout.md#screen) |
| `useTabBarInset` | The space the bar floating over the screen takes at its top, with the rows under it. | [HeaderAccessory](navigation.md#headeraccessory) |
| `caretPoint` | Where the caret is in a text field, on web. | [PopupMenu](overlays.md#popupmenu) |
| `haptic` | The feel of a touch, by what it means. | [Platform services](../services.md#haptics) |
| `saveFile` | Saves a file where the user chooses. | [Platform services](../services.md#saving-a-file) |
| `DropZone`, `useDrop` | Takes files dropped on a view, on the web. | [Platform services](../services.md#dropping-files) |
| `useKeyboardInset` | How much of a view the keyboard covers. | [Platform services](../services.md#the-keyboard-over-a-view) |
