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
| Menu `swatch` | An image with `expo-file-system`, else a monochrome symbol; a symbol in its color in `PopupMenu`; none in a native header's `HeaderMenu` | Yes; none in a native header's `HeaderMenu` whose icon has a drawable | Yes | Yes |
| `onOpenChange` on menus | Not reported | Yes | Yes | Yes |
| `ContextMenu` `at` | Ignored | Yes | Yes | Yes |
| `PopupMenu` match highlighting | No | No | Yes | No |
| `PopupMenu` moved by a press outside it | Dismissed | Dismissed | Moved | Dismissed |
| `caretPoint` | `null` | `null` | Yes | `null` |
| `Progress` indeterminate linear | Yes | Yes | Empty bar | Yes |
| `Progress` `trackColor` | Ignored | Yes | Yes | Yes |
| `Badge` `99+` | Yes | Yes | Yes | Shows the cap |
| `Badge` announced name | Label | Label; inside a host the number, then the rest of the label | Label | Label |
| `Badge` `label={null}` | No element of its own | No element of its own; inside a host the number is still read | No element of its own | No name; hidden as far as the view around the island allows |
| `Badge` `style` | Not applied inside a host | Not applied inside a host | Yes | Yes |
| `ListItem` named from its slots | Yes | The row's own texts | Yes | Yes |
| `ListItem` `selected` announced | Yes | On a row that presses, without `swipeActions` | Yes | Yes |
| `ColorPicker` `inline` | The row, the system picker from the well | Drawn in place | Drawn in place | The WinUI `ColorPicker` in place |
| `ColorPicker` swatches of a disabled picker heard | Unavailable | Not at all | Unavailable | Unavailable |
| `SegmentedControl` `size`, `shape` | `pill` only | Yes | Yes | Not applied |
| `Stepper` `formatValue` | Yes | Yes | Yes | Not applied |
| `TextField` `autoCapitalize` | Yes | Yes | Yes | No equivalent |
| `TextField` `submitBehavior` | Native | Native | Yes | Enter keeps focus |
| `onKeyPress` in `inline` and `Composer` | Keys that write, Enter, Backspace | Keys that write, Enter, Backspace | Every key but an Enter that submits a multi-line field | Keys that write, Escape, Backspace, an Enter that does not submit; no Shift |
| `keyboardType`, `autoCapitalize` in `inline` and `Composer` | Yes | Yes | Yes | `keyboardType` ignored, `autoCapitalize` only `characters` |
| `Composer` button touch target | The button | The 36dp circle it is drawn as, not Material's 48dp | The button | The button |
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
| `TabView` tab menu | Long press | Long press | Right click, Menu key, a held touch | Right click, Menu key |
| `TabView` accessory in the strip | Yes | Yes | Yes | Cards only |
| `TabView` `fill="none"` | No fill | No fill | No fill | The WinUI strip in the screen's background; no fill on the switcher's bar |
| `TabView` add button's name without `addLabel` | "New tab" | "New tab" | "New tab" | WinUI's own, in the system's language, on the strip; "New tab" on the switcher |
| `List` | SwiftUI `List` | `LazyColumn` | DOM list, windowed | `FlatList` |
| `List` `contentInset` sides | The whole list inset, its separators and scroll indicator with the rows | Content padding | Padding inside the scroller | Padding inside the scroller |
| `CardGrid` | `FlatList` | `FlatList` | CSS grid, windowed | `FlatList` |
| `Card` star while not set | Always drawn | Always drawn | Under the pointer or the keyboard where a pointer hovers; always drawn on a touch screen | Under the pointer |
| `Card` star's container | None | Material's tonal container | None | None |
| `Card` menu button | The small accent ellipsis | A 24 dp `more_vert` in the secondary label color | The small accent ellipsis | The small accent ellipsis |
| `Sheet` bar | SwiftUI content | Compose content | Drawn | Drawn |
| `Alert` field | Among the actions | Material's outlined field under the message | Under the message | In the dialog's body, through a portal |
| `Alert` field's action key | Nothing | Nothing | The first action that is not the cancel, unless it is disabled | The first action that is not the cancel, unless it is disabled |
| `Popover` dismissed by Escape | VoiceOver's escape gesture, modal cards | No | Yes, wherever the focus is | No |
| `Popover` `label` | Ignored | Ignored | Names a modal card | Names a modal card |
| `Toolbar` overflow decided by the platform | No | No | No | Yes |
| `Toolbar` menu command behind the overflow | Its entries, set off by rules | Its entries, set off by rules | Its entries, set off by rules | A submenu (`CommandBar`); its entries in a drawn bar |
| `Toolbar` menu command `active` | Filled, heard as selected | Filled, heard as checked | Filled, `aria-pressed` | Filled in a drawn bar, heard as a button; ignored by the `CommandBar`, whose `AppBarButton` with a flyout has no checked state |
| `Toolbar` command `color` | Yes | Yes | Yes | Yes; the `CommandBar` draws the glyph and the label in it |
| `FindBar` | Drawn, not `UIFindInteraction` | Drawn | Drawn | Drawn |
| `Toolbar` floating | The kit's raised capsule | Material's `HorizontalFloatingToolbar` | The kit's raised capsule | The `CommandBar` in a raised card |
| `Divider` `vertical` inside a host | The row's height | 24dp | The row's height | The row's height |
| `Button` `pressed` heard as | Selected | Checked, by Material's toggle buttons | Pressed | A button |
| `Avatar` inside a host | Drawn | Compose, read as the name; in a row that merges, the initials, then the name | Drawn | `PersonPicture` |
| `AvatarGroup` `selected` heard as | Selected | Selected | Current | Selected |
| `EmptyState` | The system's view on iOS 17 and later; composed in SwiftUI before, and while `loading` | Composed in Compose, the description hosted React Native text while `selectable` | Drawn | Drawn |
| `Collapsible` children | `@expo/ui` | `@expo/ui` | Any | Any |
| `Sheet` body without `maxHeight` | `@expo/ui` | `@expo/ui` | Any | Any |
| `Sheet` `maxHeight` fraction of | The window's height | The window's height | The viewport's dynamic height | The area the sheet's layer covers |
| `Sheet` without `snapPoints` opens | At its content's height | Whole, past the stop half way up the window Material offers a tall sheet | At its content's height, at most 85% of the viewport | As a card that stops short of the window |
| `ExternalLink` | In-app browser | In-app browser | New tab | Default browser |
| `saveFile` | A folder; the file keeps `name` | A folder; the file keeps `name` | The folder and the name in the Chromium browsers, else a download | A folder; the file keeps `name` |
| `RelativeTime` words without `locale` | English; with a polyfill, the language iOS runs the app in, one the app is localized for | English; the device's language with a polyfill | The page's `lang` | English; the user's regional format with a polyfill |
| A screen pushed over `Tabs` | Over the tab bar | Over the tab bar | Replaces the bar | Inside the pane, its back button |
| `Stack` `animation` | Native | Native | None | WinUI's motions: drill in, slides, page refresh, fade |
| A press on the selected tab | Nothing | Nothing | Nothing | Back to the section's root |
| A deep-linked screen's way home | The stack's `anchor` | The stack's `anchor` | The logo, a link to the first tab, or the `anchor` | The stack's `anchor` |
| Keyboard shortcuts | No | No | No | Yes |
| High contrast palette | No | No | No | Yes |
| Window title and chrome | No | No | No | Yes |
