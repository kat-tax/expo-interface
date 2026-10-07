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

It needs `expo-haptics`, an optional peer: without it, and on Windows,
which has no haptic engine, it plays nothing. It never throws, so a call
needs no platform check around it. The web vibration is `expo-haptics`'s
own: the Vibration API where the browser has it, and the switch-toggle
feedback Safari plays on a touch screen.

## Saving a file

`saveFile({name, content, mimeType})` saves a file where the user chooses: an
export, a backup, what the app made. `content` is text or bytes. It resolves
`true` once the file is written and `false` when the user cancels; a failure
to write rejects.

```tsx
const saved = await saveFile({name: 'notes.md', content: markdown, mimeType: 'text/markdown'});
```

| Platform | Where it goes |
| --- | --- |
| iOS | The folder the user picks in the system's document picker, through `expo-file-system` |
| Android | The folder the user picks through the Storage Access Framework, through `expo-file-system` |
| Web | The browser's save picker where it has one (the Chromium browsers), where the user picks the folder and the name; a download everywhere else |
| Windows | The folder the user picks in the shell's picker, through `expo-file-system` on `expo-windows` |

Natively it needs `expo-file-system`, an optional peer, and says so when it
is missing. `ShareLink` is the other way out: it hands the file to another
app rather than to a folder.

## Dropping files

`DropZone` takes files dropped on it: its children, with a dashed `Surface`
over them and a `label` while files are held over the zone, and `onDrop`
called with the files. `useDrop(ref, {onDrop, disabled})` makes any view a
target and answers `{over}`, for a look of the app's own.

```tsx
<DropZone onDrop={files => files.forEach(add)} label="Drop to add to the space">
  <CardGrid data={documents} renderItem={renderCard}/>
</DropZone>
```

A dropped file is `{name, type, size, file}`, `file` being the browser's
`File`. The zone counts a drag's enters and leaves, since a drag crosses
every child on its way, so the overlay holds steady over a full grid. Drags
of text or links are left to the page.

This is the web's: files reach an iOS, Android or Windows app through the
share sheet and the pickers, so there `DropZone` draws its children and
`useDrop` never fires.
