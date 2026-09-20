# Web

[Docs home](../README.md)

The web files render the real DOM, and floating UI uses the platform's own
primitives rather than a portal and a z-index:

| Behaviour | Where it comes from |
| --- | --- |
| Top layer, light dismiss, `aria-expanded` | `popover="auto"` in `Menu`, `ContextMenu`, `PopupMenu`, `Fab` |
| Placement and flipping | CSS anchor positioning with `position-try-fallbacks`, feature-detected with a measured fallback |
| Focus trap, Escape, inert background | `<dialog>` with `showModal()` in `Alert` |
| Hover and focus hint with the system delay | `interestfor` in `Tooltip`, feature-detected |
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

The Material Symbols font is registered by the kit on import.
