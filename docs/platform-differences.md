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
| Menu `swatch` | Not shown | Yes | Yes | Yes |
| `onOpenChange` on menus | Not reported | Yes | Yes | Yes |
| `ContextMenu` `at` | Ignored | Yes | Yes | Yes |
| `PopupMenu` match highlighting | No | No | Yes | No |
| `caretPoint` | `null` | `null` | Yes | `null` |
| `Progress` indeterminate linear | Yes | Yes | Empty bar | Yes |
| `Progress` `trackColor` | Ignored | Yes | Yes | Yes |
| `Badge` `99+` | Yes | Yes | Yes | Shows the cap |
| `Badge` announced name | Label | Number only | Label | Label |
| `SegmentedControl` `size`, `shape` | `pill` only | Yes | Yes | Not applied |
| `Stepper` `formatValue` | Yes | Yes | Yes | Not applied |
| `TextField` `autoCapitalize` | Yes | Yes | Yes | No equivalent |
| `TextField` `submitBehavior` | Native | Native | Yes | Enter keeps focus |
| `SearchField` `clearable` | Yes | Yes | The control's own | The control's own |
| `SearchField` suggestions with icons | Yes | Yes | Text only | Text only |
| `DateTimePicker` time bounds | Yes | Yes | Yes | Date only |
| `FieldGroup` `titleUppercase` | Ignored | Yes | Yes | Yes |
| `TabView` reordering | No | No | No | Off |
| `TabView` close on the keyboard | Button | Button | Delete | The control's cross |
| `Toolbar` overflow decided by the platform | No | No | No | Yes |
| `EmptyState` native | iOS 17+ | Drawn | Drawn | Drawn |
| `Collapsible` children | `@expo/ui` | `@expo/ui` | Any | Any |
| `ExternalLink` | In-app browser | In-app browser | New tab | Default browser |
| Keyboard shortcuts | No | No | No | Yes |
| High contrast palette | No | No | No | Yes |
| Window title and chrome | No | No | No | Yes |
