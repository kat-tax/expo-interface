# expo-interface documentation

`expo-interface` is a UI kit for Expo apps. Every component renders the
platform's own control: SwiftUI on iOS, Jetpack Compose on Android, the DOM on
web and WinUI 3 on Windows. New here? Start with
[Getting started](getting-started.md).

You can also see every component live, with its props, in the
[Storybook](https://kat-tax.github.io/expo-interface/).

## Start

| Page | What is in it |
| --- | --- |
| [Getting started](getting-started.md) | Install, wrap the app, build a screen, add tabs and icons. Troubleshooting. |

## Foundations

| Page | What is in it |
| --- | --- |
| [Theming](theming.md) | The accent seed, the light and dark scheme, color tokens, reading colors, high contrast, constants. |
| [Icons](icons.md) | Icon tokens, filled icons, Android drawables, the web font, Windows glyphs. |
| [Native hosts](hosts.md) | `Screen native` and `NativeHost`: where native controls live on iOS and Android. |

## Components

| Page | Components |
| --- | --- |
| [All components](components/README.md) | The index, one line each. |
| [Layout](components/layout.md) | `Screen`, `ScreenHeader`, `NativeHost`, `Surface`, `Card`, `Toolbar`, `KeyboardBar`, `FieldGroup`, `ListItem`, `Collapsible`, `Divider`, `EmptyState` |
| [Navigation](components/navigation.md) | `Stack`, `Tabs`, `TabStack`, `ConstrainedStackHeader`, `TabView`, `Pager`, `HeaderMenu`, `HeaderAction`, `HeaderActions`, `ExternalLink`, `ShareLink` |
| [Controls](components/controls.md) | `Button`, `Fab`, `Chip`, `IconToggle`, `Switch`, `Checkbox`, `TextField`, `SearchField`, `Picker`, `SegmentedControl`, `Slider`, `Stepper`, `DateTimePicker`, `ColorPicker` |
| [Indicators](components/indicators.md) | `Progress`, `Spinner`, `Gauge`, `Badge`, `Avatar`, `Typography` and its variants |
| [Overlays](components/overlays.md) | `Menu`, `ContextMenu`, `PopupMenu`, `Popover`, `Tooltip`, `Alert`, `Sheet`, `Toast` |

## Platforms

| Page | What is in it |
| --- | --- |
| [Web](platforms/web.md) | The browser primitives behind floating UI, keyboard patterns, CSS and the palette. |
| [Windows](platforms/windows.md) | Setting up, XAML islands, the title bar, keyboard shortcuts, right to left and scaling, standing in for `@expo/ui`. |
| [Where platforms differ](platform-differences.md) | Every difference that changes what a screen can do, in one table. |
| [Accessibility](accessibility.md) | What the kit sets on each platform, and the rules it follows. |

## Build on it

| Page | What is in it |
| --- | --- |
| [Contributing](contributing.md) | The repository, how a component is built, the checks, Storybook, the harness, the Windows build, CI. |

## Versions

Expo SDK 57 (React Native 0.86.3) and `@expo/ui` 57.0.18. The Windows files
use react-native-windows' Fabric API and are built and tested in a
react-native-windows 0.84 app with Expo 57's JavaScript, since no
react-native-windows pairs with React Native 0.86 yet. See
[expo-windows' versions page](https://github.com/kat-tax/expo-windows/blob/master/docs/versions.md).

## Related projects

- [expo-windows](https://github.com/kat-tax/expo-windows): the Windows
  platform for Expo apps, which the kit runs on there.
- [expo-vitest](https://github.com/kat-tax/expo-vitest): the per-platform
  Vitest projects, test helpers and harness the kit is tested with.
