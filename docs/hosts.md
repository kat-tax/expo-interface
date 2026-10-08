# Native hosts

[Docs home](README.md)

This page matters on iOS and Android, where the kit's controls are SwiftUI and
Jetpack Compose views. Most screens need one line of it: `<Screen native>`.

## What a host is

On iOS and Android a native control lives inside an `@expo/ui` host, the view
that carries SwiftUI or Compose content inside a React Native tree. The kit
seeds every host with the accent.

There are two ways to get one.

**A whole screen.** `Screen native` mounts one host around the screen. Use it
for a screen made of kit controls, such as a settings form.

```tsx
<Screen native>
  <FieldGroup>
    <FieldGroup.Section title="Sync">
      <Switch label="Notifications" value={on} onValueChange={setOn}/>
    </FieldGroup.Section>
  </FieldGroup>
</Screen>
```

**One control.** Where a screen cannot be native as a whole (a canvas, an
editor, a list of React Native rows), a kit control placed in the React
Native layout mounts a host of its own: a `Button` in a row of the app's
own, a `Switch` beside drawn text, a `Divider` between two views.

```tsx
<Screen>
  <Canvas/>
  <Button label="Undo" onPress={undo}/>
</Screen>
```

**A group of controls.** `NativeHost` mounts one host around several, so a
row of them is one native view rather than one host each. `direction` lays
them out as a native row or column.

```tsx
<NativeHost fit direction="row" spacing={8}>
  <Button label="Undo" onPress={undo}/>
  <Button label="Redo" onPress={redo}/>
</NativeHost>
```

`fit` sizes the host to its content. Without it the host fills the width.
`Toolbar` and `HeaderActions` share one host among their controls the same
way.

## NativeHost

| Prop | What it does |
| --- | --- |
| `fit` | Size the host to its content on both axes, or on the width alone (`'width'`, for a vertical rule in a row). By default only the height fits and the width fills the container. `'fill'` takes the size the layout gives on both axes, for content that scrolls inside the host (`List` mounts one). |
| `direction` | Lay the children out as one native `row` or `column`, with `spacing` between them. Without it the children are placed as they are. |
| `spacing` | The space between the children of a `direction`, in points. |
| `onLayoutContent` | Reports the content's laid-out size, for a parent that lays out before the platform has measured (a stack header). |
| `pointerEvents` | `none` for a host that only presents something and should not take presses. |

## Hosts cannot nest

`useNativeHost()` answers whether there is a host above. Components that
present natively mount a host of their own only when there is none:

- `Button`, `Menu`, `IconToggle`, `Switch`, `SegmentedControl`, `Divider`,
  `ListItem`, `Alert`, `Spinner` and `EmptyState` check, so they can be rendered anywhere.
  A control sized to itself (a button, a switch with no label) gets a host
  of its own size; one that fills its width (a row with a label, a
  horizontal divider, a list row, an empty state) gets a host as wide as its container and
  as tall as itself; a vertical divider gets one as tall as its row. Inside
  a `FieldGroup`, a `Screen native`, a `NativeHost` or a `Sheet` they render
  bare.
- `PopupMenu`, `Fab` (iOS and Android) and `ShareLink` (iOS)
  mount one where they need it.
- `Toast` and `Toolbar` do the same for their native parts.
- A `Sheet`'s content counts as hosted, so controls inside it render bare.

You rarely call `useNativeHost()` yourself. It is there for a component of
your own that wraps `@expo/ui` content and has to work both inside and outside
a host.

## On web and Windows

On web the host is a plain view that carries the `@expo/ui` palette.

On Windows there is no `@expo/ui` host. Every kit control is a React Native
view or a XAML island of its own, and `NativeHost` is a plain view that keeps
the contract: `useNativeHost()` answers true below it, `fit` hugs the content,
and `onLayoutContent` reports the size. `Screen native` only marks the tree as
hosted, so self-hosting components render bare.

So the same screen works on all four. You do not branch on the platform.

## Two helpers for your own `@expo/ui` content

| Export | What it does |
| --- | --- |
| `hostAccentProps(seed)` | The extra props that apply an accent seed to an `@expo/ui` `Host` of your own: `seedColor` on Android, a `tint` modifier on iOS, nothing on web, where the accent flows through CSS custom properties. |
| `fillWidth` | The modifiers that make a universal `Column` or `Row` span its parent's width. Compose and SwiftUI containers wrap their content by default. On web it is an empty list, since the primitives already stretch. |
