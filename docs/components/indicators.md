# Indicators

[Docs home](../README.md)

Progress, badges, avatars and text.

Everything is exported from `expo-interface`. Each entry says what the component
does, which props it takes, what each platform renders, and where the platforms
differ. [All components](README.md) lists the other groups.

## Progress

A linear bar or a circular ring, determinate or indeterminate. Props: `value`
(0 to 1; omit for indeterminate), `variant` (`linear`, `circular`), `size`
(24, circular only), `color`, `trackColor`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `ProgressView`. `trackColor` has no SwiftUI equivalent, and the system spinner keeps its own size. |
| Android | Material 3 `LinearProgressIndicator` or `CircularProgressIndicator` |
| Web | A real `<meter>`, or an SVG ring. The web platform has no indeterminate meter, so a linear bar without a value renders empty. |
| Windows | WinUI `ProgressBar` or `ProgressRing` |

## Spinner

The platform's activity indicator: an indeterminate circular `Progress`, in a
host of its own when it sits in a React Native layout and bare inside one.
Props: `size`, `color`, `testID`.

## Gauge

A value within a range in the SwiftUI gauge styles. Props: `value`, `min`,
`max`, `variant` (`automatic`, `linear`, `linearCapacity`, `circular`,
`circularCapacity`), `label`, `currentValueLabel`, `minimumValueLabel`,
`maximumValueLabel`, `accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Gauge` |
| Android | Redrawn from Compose primitives to the geometry measured from iOS: the rings are `CircularProgressIndicator`s, the bars clipped boxes |
| Web | DOM and SVG to the same geometry |
| Windows | Bars drawn in React Native; the rings are the WinUI `ProgressRing`. The open `circular` style is the same ring, its marker being the ring's end. |

## Badge

A count or a dot beside the thing it is about. Props: `count` (`0` draws
nothing), `max` (99; counts above draw as `99+`), `showZero`, `dot`, `label`
(the accessible name; defaults to the count and what it is about), `color`,
`textColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | Drawn as the UIKit capsule. SwiftUI's `badge` modifier only paints inside a `List`, a `TabView` or a toolbar and is silently ignored anywhere else. |
| Android | Material 3 `Badge` |
| Web | A `<span role="status">` |
| Windows | WinUI `InfoBadge`. It holds a number and nothing else, so an overflowing count reads as the cap (`99`) where the others draw `99+`; the accessible name carries the true wording. |

TalkBack reads the number alone on Android: `@expo/ui`'s Compose layer
exposes no modifier that sets a content description. The other three announce
the label.

Placing a badge over a control is the caller's job. On Windows, put it beside
a pressable control or inside it: a XAML island takes pointer input for
itself whatever React Native's `pointerEvents` says, so a badge laid over a
button swallows the button's presses.

## Avatar

A person as a colored circle with their initials, hashed from the name so
the same person keeps the same color. Props: `name`, `initials`, `color`,
`size` (28), `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn circle |
| Windows | WinUI `PersonPicture`, filled with the same hashed color |

## Typography

Text in the platform's type scale. `Typography` with a `variant`, and the
variants as components: `LargeTitle`, `Title`, `Title2`, `Title3`,
`Headline`, `Body`, `Callout`, `Subheadline`, `Footnote`, `Caption`,
`Label`. Props: `variant`, `weight`, `align`, `color` (a token),
`numberOfLines`, `level` (the heading level, overriding the one the variant
implies; `false` for a large line that is not a heading), `style`, `testID`.

The title variants are headings: `largeTitle` is level 1, `title` 2, `title2`
3, `title3` 4, `headline` 5. On web they carry `role="heading"` with
`aria-level`, on the other three `accessibilityRole="header"`, so a screen
reader can navigate by heading.

| Platform | Scale |
| --- | --- |
| iOS, Web | The iOS type scale, in `system-ui` on iOS and the CSS font variables on web |
| Android | The Material scale |
| Windows | The Fluent ramp in Segoe UI Variable: `largeTitle` is Fluent's Title Large, `title` its Title, `body` its Body, `caption` its Caption |
