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

**A group of controls.** Where a screen cannot be native as a whole (a canvas,
an editor, a list of React Native rows), `NativeHost` mounts a host around a
group of controls.

```tsx
<Screen>
  <Canvas/>
  <NativeHost fit>
    <Button label="Undo" onPress={undo}/>
  </NativeHost>
</Screen>
```

`fit` sizes the host to the button. Without it the host fills the width. For
a row of several controls, `Toolbar` and `HeaderActions` share one host among
them.

## NativeHost

| Prop | What it does |
| --- | --- |
| `fit` | Size the host to its content on both axes. By default only the height fits and the width fills the container. |
| `onLayoutContent` | Reports the content's laid-out size, for a parent that lays out before the platform has measured (a stack header). |
| `pointerEvents` | `none` for a host that only presents something and should not take presses. |

## Hosts cannot nest

`useNativeHost()` answers whether there is a host above. Components that
present natively mount a host of their own only when there is none:

- `Alert` and `Spinner` check, so they can be rendered anywhere.
- `PopupMenu`, `Fab` (iOS and Android), `ShareLink` (iOS) and `EmptyState`
  (iOS 17 and later) mount one where they need it.
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
