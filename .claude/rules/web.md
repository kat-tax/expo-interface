---
paths:
  - "**/*.web.ts"
  - "**/*.web.tsx"
  - "**/*.css"
---

# The web files

Web renders the real DOM, not a React Native emulation of it. Floating and
overlay UI uses the platform's own primitives rather than a portal and a
z-index:

- **Popover API** (`popover`, `popovertarget`) for menus, popovers and tooltips,
  with **CSS anchor positioning** (`anchor-name`, `position-anchor`,
  `position-area`) to place them.
- **`interestfor`** for hover and focus affordances.
- **`<dialog>`** for modals and sheets.

Styles live in a `.css` file beside the component, not in inline objects, so the
cascade and media queries are available.

## Testing the web files

jsdom 30 hides a closed `[popover]`, so query roles with `{hidden: true}`, and it
reports CSS anchor support while having no imperative `showPopover` (the kit
stubs it). Web tests use `@testing-library/react` and are synchronous, unlike the
native ones.
