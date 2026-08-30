# expo-interface

Native-first, universal UI kit for [Expo](https://expo.dev), built on
[`@expo/ui`](https://docs.expo.dev/versions/v56.0.0/sdk/ui/).

Every component renders the platform's real control:

| Platform | Renders with |
| -------- | ------------ |
| iOS      | SwiftUI (`@expo/ui/swift-ui`) |
| Android  | Jetpack Compose / Material 3 (`@expo/ui/jetpack-compose`) |
| Web      | Plain DOM elements styled with CSS custom properties |

One accent seed themes all three: it seeds a Material 3 palette on Android,
cascades as a SwiftUI `tint` on iOS, and is emitted as `--color-*` variables on
web. The prop surface of each component is the intersection of what the three
platforms support, so the same JSX renders a native-feeling control everywhere.

> **Status:** early. The API follows `@expo/ui`, which is itself still
> evolving, so expect breaking changes between minor versions.

## Install

```sh
npx expo install expo-interface @expo/ui expo-router expo-symbols expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
```

`expo-interface` ships TypeScript source (`src/index.ts`) and relies on Metro to
compile it, exactly like the rest of your app — no build step, and the
`.ios.tsx` / `.android.tsx` / `.web.tsx` platform files resolve as usual.

### Android drawables

Jetpack Compose controls render icons from drawables rather than symbol glyphs.
The kit's own Android controls (`Picker`, `Stepper`) import a few glyphs from
`@expo/material-symbols`, and your `IconToken`s can carry drawables for `Button`
and `Menu` items. Install `@expo/material-symbols` and register `xml` as an
asset extension in `metro.config.js`:

```js
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('xml')) {
  config.resolver.assetExts.push('xml');
}

module.exports = config;
```

## Setup

### 1. Provide the accent

Wrap the app in `AccentProvider`. Omit `seed` for the default (iOS systemBlue,
`#007AFF`) or pass a hex color to re-theme every platform at once.

```tsx
// app/_layout.tsx
import {ThemeProvider, Stack} from 'expo-router';
import {AccentProvider, useNavTheme} from 'expo-interface';

function Navigation() {
  // Reads the accent seed, so it must render inside AccentProvider.
  return (
    <ThemeProvider value={useNavTheme()}>
      <Stack screenOptions={{headerShown: false}}/>
    </ThemeProvider>
  );
}

export default function Layout() {
  return (
    <AccentProvider seed="#8959EA">
      <Navigation/>
    </AccentProvider>
  );
}
```

### 2. Emit the palette on web

`getThemeCSS()` renders the light/dark palette as `--color-*` custom
properties. Add it to the root HTML so CSS consumers (buttons, typography,
`theme.*` tokens) resolve without JavaScript.

```tsx
// app/+html.tsx
import {ScrollViewStyleReset} from 'expo-router/html';
import {getThemeCSS} from 'expo-interface';

export default function Root({children}: React.PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style dangerouslySetInnerHTML={{__html: getThemeCSS()}}/>
        <ScrollViewStyleReset/>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Build screens

`Screen` handles safe areas, the status bar, the system background color, and
the content max-width. With `native`, children are mounted inside an
accent-seeded `@expo/ui` `Host`, so you can compose SwiftUI / Compose
primitives directly.

```tsx
import {Screen, Button, Title, Body} from 'expo-interface';

export default function Home() {
  return (
    <Screen gutter>
      <Title>Hello</Title>
      <Body color="secondaryLabel">Rendered with the platform's own text.</Body>
      <Button label="Continue" onPress={() => {}}/>
    </Screen>
  );
}
```

## Components

All exports come from the package root: `import {…} from 'expo-interface'`.

### Layout

| Export | Description |
| ------ | ----------- |
| `Screen` | Safe-area screen container. Props: `native` (mount an accent-seeded `Host`), `header` (sits under a stack header), `gutter` (horizontal padding). |
| `ScreenHeader` | Simple header bar with optional back button and trailing slot. |
| `ConstrainedStackHeader` | `Stack` `header` implementation for web that matches the content max-width (renders nothing on native). |
| `TabStack` | Pre-configured `expo-router` `Stack` for a tab's root screen, themed from `useNavTheme()`. |
| `Tabs` | Tab bar: `NativeTabs` on iOS/Android, a floating top bar on web. Props: `routes`, `webLogo` (`'icon-only'`, `'text-only'`, `'icon-and-text'` or a `ReactNode`), `webIcon`. |
| `Sheet` | Accent-aware `@expo/ui` `BottomSheet`. |
| `hostAccentProps(seed)` | Extra `Host` props that apply the accent (`seedColor` on Android, `tint` modifier on iOS) — use when mounting your own `Host`. |
| `fillWidth` | Modifiers that make a universal `Column`/`Row` span its parent's width. |

### Controls

| Export | Description |
| ------ | ----------- |
| `Button` | `label`, `onPress`, `variant` (`filled` / `outlined` / `text`), `role` (`default` / `destructive`), `size`, `shape` (`rounded` / `pill` / `circle`), `color`, `prefixIcon`, `suffixIcon`, `hideLabel`, `disabled`. |
| `TextField` | `value`, `onChangeText`, `onSubmit`, `placeholder`, `keyboardType`, `autoCapitalize`, `secureTextEntry`, `multiline`, `maxLength`, `accentColor`, … |
| `Switch` | `value`, `onValueChange`, `label`, `disabled`, `accentColor`. |
| `Checkbox` | `value`, `onValueChange`, `label`, `disabled`, `accentColor`. SwiftUI checkmark glyph on iOS, M3 `Checkbox` on Android, `<input type="checkbox">` on web. |
| `Slider` | `value`, `onValueChange`, `onSlidingComplete`, `min`, `max`, `step`, `label`, `disabled`, `accentColor`. SwiftUI `Slider`, M3 `Slider`, `<input type="range">`. |
| `Stepper` | `value`, `onValueChange`, `step`, `min`, `max`, `label`, `formatValue`, `disabled`. SwiftUI `Stepper`; a pair of M3 icon buttons on Android; `<button>`s on web. |
| `Picker` | `selectedValue`, `onValueChange`, `label`, with `Picker.Item` `{label, value}` children. Menu-style dropdown. |
| `SegmentedControl` | Same API as `Picker` (`SegmentedControl.Item` children) rendered as a segmented row: SwiftUI segmented `Picker`, M3 `SingleChoiceSegmentedButtonRow`, a `radiogroup` on web. |
| `DateTimePicker` | `value`, `onChange`, `mode` (`date` / `time` / `datetime`), `minimumDate`, `maximumDate`, `label`. |
| `Progress` | `value` (0–1, indeterminate when omitted), `variant` (`linear` / `circular`), `size` (circular), `color`, `trackColor`. |
| `Menu` | Dropdown opened from a `Button`-styled trigger: `label`, `icon`, `items` (`{label, icon, role, disabled, separator, onPress}`), plus `variant` / `size` / `shape` / `color` / `hideLabel` / `disabled`. SwiftUI `Menu`, M3 `DropdownMenu`; on web a native `popover="auto"` toggled by `popovertarget` and placed with CSS anchor positioning. |
| `ContextMenu` | Long-press (right-click on web) menu around native `children`: `items`, `onPress`, `disabled`. SwiftUI `contextMenu`, M3 `DropdownMenu` via `combinedClickable`; the same native popover on web, opened at the pointer. |
| `Tooltip` | Hint around non-interactive `children`: `text`. M3 `TooltipBox` on Android; on web an `interestfor` → `popover="hint"` (hover / focus / long-press) with `title` as the fallback; iOS exposes it as an accessibility hint. |
| `Alert` | Controlled dialog: `title`, `message`, `visible`, `onDismiss`, `actions` (`{label, role: default / cancel / destructive, onPress}`), `sheet` (iOS action sheet / bottom-anchored on web), optional trigger `children`. SwiftUI `Alert` / `ConfirmationDialog`, M3 `AlertDialog`, `<dialog>` on web. |
| `Collapsible` | Disclosure row: `label`, `expanded` / `defaultExpanded`, `onExpandedChange`, native `children`. SwiftUI `DisclosureGroup`, M3 expandable item, `<details>` on web. |
| `Divider` | Hairline rule: `vertical`, `color`, `inset`. SwiftUI `Divider`, M3 `HorizontalDivider` / `VerticalDivider`, `<hr>` on web. |
| `ListItem` | Row with `leading`, `trailing`, `supporting` text and `onPress`. |
| `FieldGroup` | Re-export of `@expo/ui`'s grouped form container (styled on web). |
| `QRCode` | Renders `value` as a QR image (`size`). |
| `ExternalLink` | `expo-router` `Link` that opens in an in-app browser on native. |

### Typography

`Typography` plus one component per variant: `LargeTitle`, `Title`, `Title2`,
`Title3`, `Headline`, `Body`, `Callout`, `Subheadline`, `Footnote`, `Caption`,
`Label`. Props: `color` (a theme token), `weight`, `align`, `numberOfLines`,
`style`. Metrics follow the iOS text styles on iOS/web and the Material type
scale on Android.

### Icons

Components take an `IconToken` — an `expo-symbols` name (single string or
`{ios, android, web}` map) plus an optional Android drawable:

```ts
// icons.drawables.android.ts
import share from '@expo/material-symbols/share.xml';
export const drawables = {share};

// icons.drawables.ts (iOS/web stub)
export const drawables: Record<string, ImageSourcePropType | undefined> = {};

// icons.ts
import {icon} from 'expo-interface';
import {drawables} from './icons.drawables';

export const share = icon(
  {ios: 'square.and.arrow.up', android: 'share', web: 'share'},
  drawables.share,
);
```

### Theme

| Export | Description |
| ------ | ----------- |
| `theme` | Scheme-adaptive color tokens as opaque platform values (`PlatformColor` on iOS, theme attrs on Android, `var(--color-*)` on web) for styles the platform resolves natively. |
| `useColor(token)` | Hook returning a concrete color string for the active scheme and accent — use for anything that can't consume a `PlatformColor` (symbols, `@expo/ui` props). |
| `colors` | The raw light/dark palette. |
| `spacing`, `bound`, `inset`, `fonts`, `fontWeights`, `variants` | Layout and type constants. |
| `useNavTheme()` | React Navigation theme resolved from the palette and live accent. |
| `getThemeCSS()` | Palette as `--color-*` CSS for `+html.tsx`. |
| `AccentProvider`, `useAccentSeed`, `onAccent`, `ACCENT_SEED` | Accent seed context and helpers. |

Tokens: `label`, `secondaryLabel`, `tertiaryLabel`, `background`,
`backgroundElement`, `backgroundSelected`, `separator`, `tint`, `onTint`,
`pillBackground`, `switchTrack`, `switchOn`, `destructive`, `onDestructive`.

### Utilities

`shareUrl(url, message?)` opens the native share sheet / Web Share API;
`copyText(text)` copies on web and falls back to the share sheet on native.

### Web popovers

Anything that floats on web — `Menu`, `ContextMenu`, `Tooltip`, `Alert` —
uses the platform's own primitives rather than a positioning library: the
[Popover API](https://developer.mozilla.org/docs/Web/API/Popover_API)
(`popover`, `popovertarget`, light dismiss, top layer), the `<dialog>`
element, [CSS anchor positioning](https://developer.mozilla.org/docs/Web/CSS/CSS_anchor_positioning)
(`anchor-name` / `position-anchor` / `position-area` / `position-try-fallbacks`)
and the Interest Invoker API (`interestfor`) for hover tooltips. Engines
without anchor positioning get a measured fallback; without `interestfor`
the tooltip is the `title` attribute. The web `Button` accepts
`popoverTarget` / `popoverTargetAction` so you can wire your own popovers.

## Example app

[`example/`](./example) is **dropfiles**, a small file-drop app that exercises
every component in the kit. It resolves the package straight from `../src`
through the npm workspace, so it doubles as the development harness:

```sh
npm install
npm run web       # expo start --web
npm run ios       # expo run:ios
npm run android   # expo run:android
npm run typecheck # package + example
```

## License

MIT
