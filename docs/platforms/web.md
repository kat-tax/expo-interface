# Web

[Docs home](../README.md)

The web files render the real DOM, and floating UI uses the platform's own
primitives rather than a portal and a z-index:

| Behaviour | Where it comes from |
| --- | --- |
| Top layer, light dismiss, `aria-expanded` | `popover="auto"` in `Menu`, `ContextMenu`, `PopupMenu`, `Fab` |
| Placement and flipping | CSS anchor positioning with `position-try-fallbacks`, feature-detected once the page is running, so a menu in a static page's HTML takes its anchor after hydration, with a measured fallback |
| Focus trap, Escape, inert background | `<dialog>` with `showModal()` in `Alert` |
| Hover and focus hint with the system delay | `interestfor` in `Tooltip`, feature-detected once the page is running, so a tooltip in a static page's HTML takes the hint after hydration, with the `title` attribute as the fallback |
| Full keyboard and the native picker on mobile | `<select>` in `Picker`, `<input type="date">` in `DateTimePicker` |
| Arrow, Home, End, PageUp | `<input type="range">` in `Slider` |
| The combobox pattern | `<input type="search">` with `<datalist>` in `SearchField` |
| Press, Enter, Space, disabled | Real `<button>` elements throughout |

Where a composite ARIA role promises a keyboard pattern the browser does not
supply, `useRovingFocus` in `src/a11y` supplies it: one tab stop, arrow keys
along an axis, Home and End, typeahead, wrap or clamp, disabled items
skipped. It backs `Menu`, `ContextMenu` and `PopupMenu` (vertical, with
typeahead), `SegmentedControl` (horizontal, selection following focus) and
`TabView` (horizontal, automatic activation). Typeahead matches visible text
and skips `aria-hidden` icon ligatures.

Styles live in a `.css` file beside each component. The palette is CSS
custom properties from `getThemeCSS()`, the accent is `--color-tint` set by
`AccentProvider`, and a forced scheme is `data-theme` on the root.

The kit's materials (`Tabs webMaterial`, `ScreenHeader material`, `Material`,
`Surface material` and the `material` of every overlay) are `backdrop-filter`
under a fill thinned with `color-mix`, on one scale of opacity and radius per
thickness, drawn by `src/material/material.css` from `data-material`
attributes: the thickness (`thin`, `regular`, `thick`), the fill that is
thinned (the raised fill or the screen's) and the edge the hairline and
shadow go on (`all`, `top`, `bottom`, `none`, or `float` for an overlay: the
hairline all round and the shadow a raised `Surface` floats on). `@supports`
falls back to the solid fill where the blur is not available, and so do
`prefers-reduced-transparency: reduce` and `forced-colors: active`.

Every overlay draws on `AccentProvider overlayMaterial` unless its own
`material` says otherwise, and is opaque without either: the `Sheet`, whose
drawer takes the attributes as it opens, since `@expo/ui` renders it in a
portal and forwards only the props it names, and whose fill is handed in
thinned as `containerColor`, which the drawer paints inline; the menus
(`Menu`, `ContextMenu`, `PopupMenu`, `Fab`, and the menus `HeaderMenu`, a
`Card`, a `Toolbar` and the `ColorPicker` open); the `Popover` card; a floating
`Toolbar`; the `Alert`; the `Toast`; and the `Tooltip`, whose hint keeps its
text in the label color on the fill. Each one's own border, fill and shadow
give way to the material's.

The Material Symbols font is registered by the kit on import.
