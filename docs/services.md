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
