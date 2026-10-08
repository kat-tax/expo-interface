# Where platforms differ

[Docs home](README.md)

The differences that change what a screen can do, in one place:

| Feature | iOS | Android | Web | Windows |
| --- | --- | --- | --- | --- |
| Swipe actions on `ListItem` | Swipe | Context menu | Context menu | Context menu |
| `Tooltip` | An accessibility hint, nothing visible | Long press | Hover and focus | Hover and focus, not announced |
| `Sheet` material | Yes | No | Yes | No |
| `Alert` action sheet | Yes | Actions stacked | Anchored to the bottom | A dialog |
| Menu `shortcut` | Ignored | Ignored | Ignored | Drawn and bound |
| Menu `swatch` | An image, with `expo-file-system` | Yes | Yes | Yes |
| `onOpenChange` on menus | Not reported | Yes | Yes | Yes |
| `ContextMenu` `at` | Ignored | Yes | Yes | Yes |
| `PopupMenu` match highlighting | No | No | Yes | No |
| `PopupMenu` moved by a press outside it | Dismissed | Dismissed | Moved | Dismissed |
| `caretPoint` | `null` | `null` | Yes | `null` |
| `Progress` indeterminate linear | Yes | Yes | Empty bar | Yes |
| `Progress` `trackColor` | Ignored | Yes | Yes | Yes |
| `Badge` `99+` | Yes | Yes | Yes | Shows the cap |
| `Badge` announced name | Label | Label; the number only inside a host | Label | Label |
| `Badge` `style` | Yes | Not applied inside a host | Yes | Yes |
| `ListItem` named from its slots | Yes | The row's own texts | Yes | Yes |
| `ListItem` `selected` announced | Yes | On a row that presses, without `swipeActions` | Yes | Yes |
| `ListItem` `badgeColor` that is not hex | Yes | Yes | Yes | Fluent's critical red |
| `SegmentedControl` `size`, `shape` | `pill` only | Yes | Yes | Not applied |
| `Stepper` `formatValue` | Yes | Yes | Yes | Not applied |
| `TextField` `autoCapitalize` | Yes | Yes | Yes | No equivalent |
| `TextField` `submitBehavior` | Native | Native | Yes | Enter keeps focus |
| `onKeyPress` in `inline` and `Composer` | Keys that write, Enter, Backspace | Keys that write, Enter, Backspace | Yes | Keys that write, Escape, Backspace, an Enter that does not submit; no Shift |
| `keyboardType`, `autoCapitalize` in `inline` and `Composer` | Yes | Yes | Yes | `keyboardType` ignored, `autoCapitalize` only `characters` |
| `SearchField` `clearable` | Yes | Yes | The control's own | The control's own |
| `SearchField` suggestions with icons | Yes | Yes | Text only | Text only |
| `HeaderSearch` `stacked` | Native | Drawn under the app bar | Drawn under the header | Drawn under the header |
| `HeaderSearch` `integrated` | Native on iOS 26 | A bottom `Toolbar` | A bottom `Toolbar` | A bottom `Toolbar` |
| `HeaderSearch` `action` | Native on iOS 26 | Native | Drawn | Drawn |
| `HeaderSearch` `inline` | Native on iOS 16 to 18 | The `SearchView` kept open | Drawn, frameless | Drawn, the `AutoSuggestBox` |
| `HeaderSearch` `hideWhenScrolling`, `integration` | Yes | Ignored | Ignored | Ignored |
| `DateTimePicker` time bounds | Yes | Yes | Yes | Date only |
| `DateTimePicker` presented | A popover from the chip | The dialogs, in the middle of the screen | The browser's picker at the chip | A flyout under the chip |
| `DateTimePicker` days without bounds | Any | The years 1900 to 2100, widened to the value's year | From the year 1 | 1900 to 2100, widened to the value; none before 1601 |
| `FieldGroup` `titleUppercase` | Ignored | Yes | Yes | Yes |
| `TabView` reordering | No | No | No | Off |
| `TabView` close on the keyboard | Button | Button | Delete | The control's cross |
| `TabView` tab menu | Long press | Long press | Right click, Menu key | Right click, Menu key |
| `TabView` accessory in the strip | Yes | Yes | Yes | Cards only |
| `TabView` `fill="none"` | No fill | No fill | No fill | The WinUI strip in the screen's background; no fill on the switcher's bar |
| `List` | SwiftUI `List` | `LazyColumn` | DOM list, windowed | `FlatList` |
| `CardGrid` | `FlatList` | `FlatList` | CSS grid, windowed | `FlatList` |
| `Card` star while not set | Always drawn | Always drawn | Under the pointer or the keyboard where a pointer hovers; always drawn on a touch screen | Under the pointer |
| `Sheet` bar | SwiftUI content | Compose content | Drawn | Drawn |
| `Alert` field | Among the actions | Under the message | Under the message | In the dialog's body, through a portal |
| `Alert` field's action key | Nothing | Nothing | The first action that is not the cancel, unless it is disabled | The first action that is not the cancel, unless it is disabled |
| `Popover` dismissed by Escape | VoiceOver's escape gesture, modal cards | No | Yes, wherever the focus is | No |
| `Popover` `label` | Ignored | Ignored | Names a modal card | Ignored |
| `Toolbar` overflow decided by the platform | No | No | No | Yes |
| `Toolbar` menu command behind the overflow | Its entries, set off by rules | Its entries, set off by rules | Its entries, set off by rules | A submenu (`CommandBar`); its entries in a drawn bar |
| `FindBar` | Drawn, not `UIFindInteraction` | Drawn | Drawn | Drawn |
| `Toolbar` floating | The kit's raised capsule | Material's `HorizontalFloatingToolbar` | The kit's raised capsule | The `CommandBar` in a raised card |
| `Button` `pressed` heard as | Selected | Checked, by Material's toggle buttons | Pressed | A button |
| `AvatarGroup` `selected` heard as | Selected | Selected | Current | Selected |
| `EmptyState` | The system's view on iOS 17 and later, composed in SwiftUI before | Composed in Compose | Drawn | Drawn |
| `Collapsible` children | `@expo/ui` | `@expo/ui` | Any | Any |
| `ExternalLink` | In-app browser | In-app browser | New tab | Default browser |
| A screen pushed over `Tabs` | Over the tab bar | Over the tab bar | Replaces the bar | Inside the pane, its back button |
| `Stack` `animation` | Native | Native | None | WinUI's motions: drill in, slides, page refresh, fade |
| A press on the selected tab | Nothing | Nothing | Nothing | Back to the section's root |
| Keyboard shortcuts | No | No | No | Yes |
| High contrast palette | No | No | No | Yes |
| Window title and chrome | No | No | No | Yes |
