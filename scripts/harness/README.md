# The harness

Run the kit on a platform, drive it, and look at what it drew. One command,
four platforms, the same steps everywhere.

```sh
node scripts/harness/index.ts doctor
```

```
what this machine can drive:

  yes  web      Chromium at chrome-headless-shell-win64
  no   windows  no app to drive: build one (scripts/windows-ci.sh) and pass --target <exe or process name>
  yes  android  1 device: 2B221FDH3S0HDK
  no   ios      the iOS simulator only runs on macOS
```

## Steps

Steps run in order in one session, so a sequence is a flow rather than four
disconnected commands.

```sh
# the example on web, from the dev server
node scripts/harness/index.ts -p web --url http://localhost:8085 \
  open / wait 3000 screenshot home.png tree

# a Windows build, deep-linked to a route
node scripts/harness/index.ts -p windows \
  --target example/windows/x64/Release/DropFiles.exe \
  open /detail wait 1000 screenshot detail.png tree

# a device
node scripts/harness/index.ts -p android --scheme dropfiles \
  open /settings screenshot settings.png
```

| Step | What |
| --- | --- |
| `open <path or url>` | a route, as a deep link or a URL |
| `screenshot <file>` | a PNG, under `.harness/` unless the path says otherwise |
| `tap <x> <y>` | a press, in the window's own pixels from its top left |
| `type <text>` | into whatever has focus |
| `tree` | the accessibility tree, as a screen reader reads it |
| `raise` | bring the app to the front (desktop) |
| `wait <ms>` | let something settle |
| `idle` | how long the machine has been quiet |

Options: `--url`, `--scheme`, `--target`, `--out <dir>`, `--force`.

## What each platform can do

| | web | windows | android | ios |
| --- | :-: | :-: | :-: | :-: |
| open | ✓ | ✓ | ✓ | ✓ |
| screenshot | ✓ | ✓ | ✓ | ✓ |
| tap, type | ✓ | ✓ | ✓ | |
| tree | ✓ | ✓ | ✓ | |

iOS is the gap: `simctl` gives a simulator screenshots and deep links and
nothing else, so a press there needs a UI test target running inside the app.
Those steps say so and are skipped rather than failed, so the same script runs
on all four and tells you what it could not do.

Underneath: Chromium through Playwright on web, the window manager and UI
Automation on Windows, `adb` on Android, `simctl` on iOS. Nothing is installed
in the app itself.

## Two things worth knowing

**Synthetic input goes to whatever is in front.** If someone is using the
machine, a press meant for the app lands in their window instead and nothing
says so — a debugging session once went two hours on clicks that were landing
in a browser. So `tap` and `type` check first how long the machine has been
quiet and refuse if it has not been. Pass `--force` when you know the desk is
free.

**A screenshot does not raise the window**, because raising it would hide the
flyout or share sheet that is usually the thing being looked at. Use the
`raise` step when the app really does need to be in front, which is what
synthetic input needs.

## Getting an app to drive

| Platform | How |
| --- | --- |
| web | `bun run web`, or `cd example && npx expo start --web --port 8085` |
| windows | `scripts/windows-ci.sh <workdir>` builds and packages one; point `--target` at the exe it leaves |
| android | `bun run android` onto a device or emulator |
| ios | `bun run ios` into a simulator |

Screenshots land in `.harness/`, which is not committed.

## From Vitest

The same drivers back a test API in the shape `mobile-test` uses, so a flow is
a test rather than a shell invocation. The assertion is the accessibility tree,
not the pixels: a tree is stable across machines and scale factors, it diffs
legibly in review, and it is what a screen reader reads.

```ts
import {by, device, element} from '../vitest/device/index.ts';

await device.open('/');
await element(by.label('Settings')).press();
await element(by.label('Name')).waitFor();
expect(await device.fullSnapshot()).toHaveElement(by.label('Email'));
expect(await device.snapshot({interactive: true})).toBeFullyLabelled();
```

Run them against whatever is up. They are opt-in and never part of
`bun run test`, because they need a real app somewhere:

```sh
HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8085 bun run test:device
HARNESS_PLATFORM=windows HARNESS_TARGET=<path to the exe> bun run test:device
HARNESS_PLATFORM=android bun run test:device
```

`toBeFullyLabelled` is the matcher that keeps earning its place: it fails with
the ref and position of every control a screen reader would announce as its
role alone. That is the defect we keep finding on Windows, where a button made
of a glyph and a text block names nothing by itself.

## Where each platform is driven from

| Platform | Driven by | Why |
| --- | --- | --- |
| windows | this repository | `agent-device` has no Windows backend, and a react-native-windows app has no remote protocol |
| web | headless Chromium here | already in the repository's dependencies; nothing to install |
| ios, android | `agent-device` | it does those far better than a hand-rolled simctl or adb wrapper, and installs its own runners without touching the app |

`agent-device` is not a dependency of this repository. Install it when you want
iOS or Android (`npm i -g agent-device`); `doctor` says so when it is missing.

## Screenshots

`toMatchScreenshot` compares the screen against a baseline committed under
`device/__screenshots__/<platform>/`. The first local run writes the baseline
and passes; in CI a missing baseline fails, so a run cannot go green by
inventing its own expectations. A failure leaves the picture it took and a
diff with the changed pixels in red over a faded copy, both under `.harness/`.

The comparison is `scripts/harness/lib/png.ts` — a chunk walk, an inflate and
the five scanline filters on Node's own zlib, rather than two dependencies for
the same thing. It reads the 8-bit non-interlaced PNGs that Chromium, GDI+ and
`adb` write, and says so plainly for anything else. `tolerance` absorbs the
one-off channel drift that text rendering produces between runs; `maxRatio` is
how much of the picture may differ before the test fails.

The tree is still the better assertion for behaviour. Use a screenshot for what
a tree cannot see: spacing, colour, the thing actually being drawn.

A baseline belongs to the machine that drew it: the same page renders
differently under a different font stack, so one recorded on a desk cannot be
asserted on a Linux runner. Recording is therefore deliberate and never a side
effect of a run:

```sh
HARNESS_UPDATE_SCREENSHOTS=1 bun run test:device   # record
bun run test:device                                # assert against what was recorded
```

Without a baseline the picture is kept as evidence and the test passes on its
tree assertions, which is what CI does — none are committed, because none of
them would match another machine. Commit one only when the machine that
asserts it is the machine that drew it.
