# Platform services

[Docs home](README.md)

A few platform calls every app makes, made once by the kit: each takes what
the app means and does what the platform does for it.

## Haptics

`haptic(kind)` plays the feel of a touch by what it means:

| Kind | When | iOS | Android | Web |
| --- | --- | --- | --- | --- |
| `lift` | Something is picked up: a drag starts, a long press takes hold | A medium impact | `DRAG_START` (API 34), else `LONG_PRESS` | A short vibration |
| `step` | It passes a detent: a slot, a snap point | The selection tick | `SEGMENT_TICK` (API 34), else `CLOCK_TICK` | A short vibration |
| `drop` | It is put down | A light impact | `GESTURE_END` (API 30), else `CONTEXT_CLICK` | A short vibration |

```tsx
onDragStart={() => haptic('lift')}
onSnap={() => haptic('step')}
onDragEnd={() => haptic('drop')}
```

Steps are paced, so a drag can call `haptic('step')` on every slot it
crosses: a `step` within 120 ms of a `lift`, or within 45 ms of the last
step played, plays nothing. A drag across many slots then ticks no faster
than a vibrator plays effects apart, which on Android is one at a time. On
the web the gap is 100 ms: each step is a 50 ms vibration, and the next one
would cut it short. `lift` and `drop` always play.

It needs `expo-haptics`, an optional peer: without it, and on Windows,
which has no haptic engine, it plays nothing. It never throws, so a call
needs no platform check around it. The web vibration is `expo-haptics`'s
own: the Vibration API where the browser has it, and the switch-toggle
feedback Safari plays on a touch screen.

## Saving a file

`saveFile({name, content, mimeType})` saves a file where the user chooses: an
export, a backup, what the app made. `content` is text or bytes. It resolves
`true` once the file is written and `false` when the user cancels; a failure
to write rejects. A web download resolves `true` once it starts, since the
browser does not say whether the file was kept.

```tsx
const saved = await saveFile({name: 'notes.md', content: markdown, mimeType: 'text/markdown'});
```

| Platform | Where it goes |
| --- | --- |
| iOS | The folder the user picks in the system's document picker, through `expo-file-system`, under the `name` the app gives |
| Android | The folder the user picks through the Storage Access Framework, through `expo-file-system`, under the `name` the app gives. The system asks the user to let the app into the folder, and from Android 11 Download itself cannot be picked, only a folder in it |
| Web | The browser's save picker where it has one (the Chromium browsers), where the user picks the folder and the name; a download everywhere else, and where the picker will not open, as when the press that started the save is too long ago |
| Windows | The folder the user picks in the shell's picker, through `expo-file-system` on `expo-windows`, under the `name` the app gives |

Natively the user picks a folder, not a name: `expo-file-system` has a
folder picker and no save picker. A file of the same name in the folder is
kept, and the new one takes the platform's name for a copy: `notes 2.md` on
iOS, `notes (1).md` on Android and Windows. On all three the file's type
follows its extension, and `mimeType` is the web's. On Android both rest on
the name `expo-file-system` takes from each document's URI, which the
device's own storage builds from the file's name and another app's document
provider, such as a cloud drive, may not: in such a folder the provider
names a copy itself or keeps two files of one name, and it may record the
type as `application/octet-stream`.

Natively it needs `expo-file-system`, an optional peer, and says so when it
is missing. `ShareLink` is the other way out: it hands the file to another
app rather than to a folder.

## Dropping files

`DropZone` takes files dropped on it: its children, with a dashed `Surface`
over them and a `label` while files are held over the zone, and `onDrop`
called with the files. `useDrop(ref, {onDrop, disabled})` makes any view a
target and answers `{over}`, for a look of the app's own.

```tsx
<DropZone style={{flex: 1}} onDrop={files => files.forEach(add)} label="Drop to add to the space">
  <CardGrid data={documents} renderItem={renderCard}/>
</DropZone>
```

A zone around a `List` or a `CardGrid` takes `flex: 1`, as any view
around them does, so the list fills the zone and scrolls inside it. On the
web a zone left at its own height grows to every row, and nothing scrolls;
on iOS, Android and Windows it gives the list no height at all.

A dropped file is `{name, type, size, file}`, `file` being the browser's
`File`. The zone counts a drag's enters and leaves, since a drag crosses
every child on its way, so the overlay holds steady over a full grid. Drags
of text or links are left to the page.

While a zone is mounted, a file dropped anywhere else on the page is
refused, and the pointer shows that nothing takes it, so the browser does
not open the file in place of the app. A disabled zone does the same. Text
and links are left to the page, and a file input takes its own drops. The
refusal comes after every other listener: a page-wide target of the app's
own, on the document or the window, hears the drag first, and a drag it
takes keeps the effect it set and reaches its drop.

This is the web's: files reach an iOS, Android or Windows app through the
share sheet and the pickers, so there `DropZone` draws its children and
`useDrop` never fires.

## The keyboard over a view

`useKeyboardInset(ref)` answers how much of a view the keyboard covers, in
points: zero while it is down or clear of the view. It is for a view the kit
does not lay out itself, such as an editor or a canvas, that has to keep
what is typed in sight. `KeyboardBar` is the kit's own answer for a bar.

```tsx
const editor = useRef<View>(null);
const covered = useKeyboardInset(editor);
<View ref={editor} style={{flex: 1, paddingBottom: covered}}>
```

A `Surface` takes the ref as a `View` does, so one surface can keep the
browser's menu closed and be measured.

| Platform | Reads |
| --- | --- |
| iOS | The keyboard's frame as it starts to change (`keyboardWillChangeFrame`), so the answer arrives with the keyboard, measured against the view in the window |
| Android | `keyboardDidShow`, measured the same way |
| Web | The visual viewport, which a phone's browser shrinks to what the on-screen keyboard leaves: the part of the view inside the page that the visual viewport no longer shows |
| Windows | The touch keyboard, which `expo-windows` raises `keyboardDidShow` for |

## Launch and window colors

The kit's config plugin paints the launch screen and Android's window behind
the app in the kit's background for each scheme, so nothing shows Expo's
defaults before the first screen does:

```json
{"expo": {"plugins": ["expo-interface"]}}
```

`["expo-interface", {"light": "#fafafa", "dark": "#111111"}]` colors the
launch screen and Android's window with colors of the app's own; the
palette's `background` is the default.

| What | How |
| --- | --- |
| Android's window | `android:windowBackground` in the app theme, with the light color in `values` and the dark one in `values-night`, so the window follows the scheme from the moment the app starts. The light color is also the app's `android.backgroundColor`, which `expo-system-ui` writes to the same place |
| iOS's window | Left to the app. With no `backgroundColor` or `ios.backgroundColor` of the app's own, `expo-system-ui` starts the root view in white or black for the scheme the app launches in, the palette's `background`, and `Screen` paints the scheme's as the app loads. `expo-system-ui` keeps the color `Screen` last painted and starts the next launch in it. A color of the app's own there is one color for both schemes |
| The launch screen | `expo-splash-screen`'s `backgroundColor` and `dark.backgroundColor`, when the app has `expo-splash-screen` and does not configure it itself |

An app's own `backgroundColor` or `android.backgroundColor` replaces the
light color, and its `expo-splash-screen` options replace the launch
screen's. Android's night window keeps the plugin's `dark` color, so an app
that gives its own color and wants another at night passes `dark` too.
