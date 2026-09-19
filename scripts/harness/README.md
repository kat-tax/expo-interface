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
