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
(the accessible name; defaults to the count and what it is about), `color`
(the fill, a palette token such as `tint`, which follows the scheme, or any
color React Native reads; the destructive red without one, Fluent's
critical fill on Windows), `textColor` (without one, black or white,
whichever reads on the fill; white on a fill that cannot be read, such as a
CSS variable on web),
`pulse` (the badge's opacity goes down and back up every 900 ms: someone
typing, a sync in flight; still while the user asks for less motion),
`style`, `testID`.

A pulse is each platform's own animation. Inside a host on Android, Compose
animates the badge's alpha toward each end in turn. It is told which end
from JavaScript every half pulse, since `@expo/ui`'s Compose animations do
not repeat by themselves, so a pulsing badge there renders twice a pulse. A
drawn badge (iOS, and Android outside a host) and the Windows island loop the
opacity of the view, on the native driver on iOS and Android. The web runs a
CSS animation that `prefers-reduced-motion` stills.

| Platform | Renders |
| --- | --- |
| iOS | Drawn as the UIKit capsule. SwiftUI's `badge` modifier only paints inside a `List`, a `TabView` or a toolbar and is silently ignored anywhere else. |
| Android | Material 3 `Badge` inside a native host; outside one, drawn in React Native to Material's geometry (a 6 point dot, 16 points high with a number), since a Compose view draws only inside a host. Both set the number in Material's Label Small. Inside a host it takes no `style`. |
| Web | A `<span role="status">` |
| Windows | WinUI `InfoBadge`. It holds a number and nothing else, so an overflowing count reads as the cap (`99`) where the others draw `99+`; the accessible name carries the true wording. |

A drawn badge and the other three platforms announce the label. Inside a
host on Android `@expo/ui`'s Compose layer exposes no modifier that sets a
content description, and TalkBack reads the number the badge draws, so the
rest of the label ("new" of "3 new", the whole label of a dot) is unseen
text laid over the badge at its size. TalkBack reads it after the number: as
part of a row that presses or a Material `ListItem`, which merge what they
hold, and as a stop of its own anywhere else.

Placing a badge over a control is the caller's job. On Windows, put it beside
a pressable control or inside it: a XAML island takes pointer input for
itself whatever React Native's `pointerEvents` says, so a badge laid over a
button swallows the button's presses.

## Avatar

A person as a colored circle with their initials, hashed from the name so
the same person keeps the same color. Props: `name`, `initials`, `color`,
`size` (28), `ring` (a 2 point ring inside the edge, a palette token or a
color: the person's own while they type), `dimmed` (half opacity: someone
away), `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn circle |
| Windows | WinUI `PersonPicture`, filled with the same hashed color. A ring is the view around the picture, which is drawn the ring's width smaller inside it. |

## AvatarGroup

People as overlapping faces, a facepile: the peers on a document. Each face
overlaps the one before it by a quarter of its size, parted from it by a
ring in the fill behind the group, and past `max` the rest are counted in a
`+N` face.

```tsx
<AvatarGroup
  people={peers.map(peer => ({
    name: peer.name,
    color: peer.color,
    dimmed: peer.away,
    ring: peer.typing ? peer.color : undefined,
    label: `Follow ${peer.name}`,
    selected: peer.id === following,
    disabled: !peer.reachable,
  }))}
  onPress={peer => follow(peer)}
  onLongPress={peer => openMenu(peer)}
/>
```

Props: `people` (each `name`, `initials`, `color`, `ring`, `dimmed`, `key`,
`label`, `hint`, `selected`, `disabled`), `max` (3), `size` (24), `ring`
(the parting ring, a palette token or a color: `background` by default, so
give the fill behind the group when it sits on a raised surface; a person's
own `ring` wins), `onPress(person, index)`, `onLongPress(person, index)`,
`onPressMore`, `testID`.

A face is a button named for the person when the group is told what a press
or a press and hold does, and the count a button named "3 more" with
`onPressMore`. A person's `label` names the face in place of the name, and
`hint` is read after it: what a press or a press and hold does, or more
about the person when the group does not press. An empty label is the name
and an empty hint is none. The hint is an accessibility hint on iOS and
Android, the help text on Windows and the description on web. `selected`
announces the face as selected (on web as the current one, since neither a
button nor an image can be selected) and draws nothing, so show it with the
person's `ring`. A `disabled` face takes neither press, is announced as
unavailable and is drawn at half opacity. When the group does not press, the
circle itself carries the label, the hint and the selected state, and
`disabled` only dims it; on web each face and the count are then images,
since a name on an element with no role goes unread. The faces are drawn in
React Native on every platform, Windows included, where `Avatar` is a
`PersonPicture` island: an island takes the pointer, and a facepile's faces
are pressed.

## Typography

Text in the platform's type scale. `Typography` with a `variant`, and the
variants as components: `LargeTitle`, `Title`, `Title2`, `Title3`,
`Headline`, `Body`, `Callout`, `Subheadline`, `Footnote`, `Caption`,
`Label`. Props: `variant`, `weight`, `align`, `color` (a token),
`numberOfLines`, `selectable` (the text can be selected and copied: a
licence, a reason, an address; off by default, as the platforms' own labels
are), `level` (the heading level, overriding the one the variant implies;
`false` for a large line that is not a heading), `style`, `testID`.

The title variants are headings: `largeTitle` is level 1, `title` 2, `title2`
3, `title3` 4, `headline` 5. On web they carry `role="heading"` with
`aria-level`, on the other three `accessibilityRole="header"`, so a screen
reader can navigate by heading.

| Platform | Scale |
| --- | --- |
| iOS, Web | The iOS type scale, in `system-ui` on iOS and the CSS font variables on web |
| Android | The Material scale |
| Windows | The Fluent ramp in Segoe UI Variable: `largeTitle` is Fluent's Title Large, `title` its Title, `body` its Body, `caption` its Caption |

## RelativeTime

A moment as the time since or until it: "now", "5 minutes ago", "yesterday",
"in 2 hours". It keeps itself current, rendering again when what it says
changes (at 45 seconds for "now", then every half unit), and nothing around
it renders with it.

Props: `date` (a `Date` or milliseconds), `variant` (a `Typography` style,
`footnote` by default), `color` (a token, `secondaryLabel` by default),
`numeric` (`auto` says "now" and "yesterday" where the language has the
words; `always` says "1 day ago"), `locale` (the language of the words, a
BCP 47 tag such as `de` or `pt-BR`; on web the page's language by default),
`numberOfLines`, `testID`.

```tsx
<RelativeTime date={document.editedAt}/>
```

`useRelativeTime(date, {numeric, locale})` answers the same words as a
string, for text that cannot hold a view: a `ListItem`'s `value`, a `Card`'s
`subtitle`, a label. The component that calls it renders again as the words
may change. A `renderItem` function cannot call a hook, so a list calls it
in the row's own component:

```tsx
function NoteRow({note}: {note: Note}) {
  const edited = useRelativeTime(note.editedAt);
  return <ListItem value={edited}>{note.title}</ListItem>;
}
```

The units round as a person does: under 45 seconds is "now", then minutes
up to 45, hours up to 22, days up to 26, months up to 11, and years.

| Platform | Words |
| --- | --- |
| Web | `locale`'s, else the page's language, through `Intl.RelativeTimeFormat`. The page's language is the `lang` of its `<html>`: `web.lang` in the app config for a single-page app, or the `lang` that `+html.tsx` sets for a static one. The words follow it when it changes, so they are the app's language rather than the browser's. A server has no page to read, so it renders a static page's words in English without a `locale`, and so does the first render in the browser, which hydrates that HTML; the next render says them in the page's language. The server's words are for the moment it rendered them, so a page loaded after they change hydrates with different words, which React reports as a hydration mismatch and renders again in the browser. |
| iOS, Android, Windows | English: Hermes has no `Intl.RelativeTimeFormat`. With a polyfill for it, such as FormatJS's `@formatjs/intl-relativetimeformat` and its locale data, `locale`'s or the device's language, with no change in the kit. |

A tag the engine cannot read (`en_US`) gets the engine's default language.
