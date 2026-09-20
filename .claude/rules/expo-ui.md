---
paths:
  - "**/*.ios.tsx"
  - "**/*.android.tsx"
  - "**/*.native.ts"
---

# The native files

iOS renders SwiftUI and Android Jetpack Compose, both through `@expo/ui`. The
kit draws nothing of its own where the platform has a control, and a single
accent colour seeds the theme: read it from the accent context rather than
hard-coding one.

## Modifiers

Controls are configured with modifier arrays from `@expo/ui/swift-ui/modifiers`
and `@expo/ui/jetpack-compose/modifiers`.

**SwiftUI's colour-bearing modifiers take a shape style since `@expo/ui`
57.0.18**, and a bare colour is shorthand for one. `tint('#FF9500')` now
produces `{$type: 'tint', tint: {type: 'color', color: '#FF9500'}}`, and
`foregroundStyle` and `background` nest theirs under `style` the same way.
Compose's `background` is unchanged and still carries a plain `color`, so a
shared `.native.test.tsx` asserting both platforms needs the two shapes in its
two branches. A shape style can also be a gradient, a material or a hierarchical
style.

## Android

Compose views must be **direct children** of the `@expo/ui` `Host`. A React
Native `View` in between breaks them. This is why the Storybook has no
backgrounds addon, and why stories must not wrap Compose controls in views.

## Both

- A control that sits inside a React Native layout needs its own host; the kit's
  `NativeHost` is that, seeded with the accent.
- What a platform has no counterpart for should say so honestly rather than be
  faked: render nothing and warn once in development, the way `elsewhere()` does
  in the Windows aliases.
