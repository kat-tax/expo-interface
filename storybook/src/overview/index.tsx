import type {PropsWithChildren} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AccentProvider} from 'expo-interface';
import pkg from '../../../package.json';
import {useGlobals} from '../../.storybook/globals';
import {normalizeAccent} from '../../.storybook/theme';
import {CardGrid, DocsLink} from './cards';
import {controls, indicators, layout, navigation, overlays} from './previews';
import {AndroidIcon, AppleIcon, ChangelogIcon, GitHubIcon, GlobeIcon, NpmIcon, TagIcon, WindowsIcon} from './icons';
import {
  A,
  Badge,
  Badges,
  Code,
  Description,
  H1,
  H2,
  H3,
  Header,
  Li,
  P,
  Page,
  Rule,
  Strong,
  ToolButton,
  Toolbar,
  ToolbarGroup,
  Ul,
  Version,
} from './styles';

const REPO = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const EXAMPLE = `${REPO}/tree/master/example`;
const EXPO_UI = 'https://docs.expo.dev/versions/v57.0.0/sdk/ui/';

/** Wraps the page in what the story decorators provide: safe-area insets and the toolbar's accent. */
function Providers({children}: PropsWithChildren) {
  const {accent} = useGlobals();
  return (
    <SafeAreaProvider>
      <AccentProvider seed={normalizeAccent(accent)}>{children}</AccentProvider>
    </SafeAreaProvider>
  );
}

export function Overview() {
  return (
    <Providers>
      <Page>
        <Header>
          <H1>Expo Interface</H1>
          <Description>A native-first, universal UI kit for Expo built on @expo/ui</Description>
          <Badges>
            <Badge><AndroidIcon/>Android</Badge>
            <Badge><AppleIcon/>iOS</Badge>
            <Badge><GlobeIcon/>Web</Badge>
            <Badge><WindowsIcon/>Windows</Badge>
          </Badges>
        </Header>
        <Toolbar>
          <ToolbarGroup>
            <ToolButton href={REPO} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GitHubIcon/>GitHub
            </ToolButton>
            <ToolButton href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noopener noreferrer" aria-label="npm">
              <NpmIcon/>npm
            </ToolButton>
            <ToolButton href={`${REPO}/releases`} target="_blank" rel="noopener noreferrer" aria-label="Changelog">
              <ChangelogIcon/>Changelog
            </ToolButton>
          </ToolbarGroup>
          <Version>
            <TagIcon/>
            Version:
            <Badge>{pkg.version}</Badge>
          </Version>
        </Toolbar>
        <Rule/>

        <P>
          <Code>expo-interface</Code> is a set of universal components for{' '}
          <A href="https://expo.dev" target="_blank" rel="noopener noreferrer">Expo</A> built on{' '}
          <A href={EXPO_UI} target="_blank" rel="noopener noreferrer"><Code>@expo/ui</Code></A>. Every
          component renders the platform&apos;s own control, a single accent color seeds the theme
          on every platform and screens follow the system light or dark scheme without
          per-platform styling. See the <DocsLink href="?path=/docs/guides-installation--docs">Installation</DocsLink> guide
          to add it to an app.
        </P>

        <H2 id="available-platforms">Available platforms</H2>
        <P>Components are available for the following platforms:</P>
        <Ul>
          <Li><Strong>iOS</Strong>: SwiftUI controls, tinted from the accent seed</Li>
          <Li><Strong>Android</Strong>: Jetpack Compose (Material 3) controls with a palette generated from the seed</Li>
          <Li><Strong>Web</Strong>: real DOM elements styled with CSS custom properties; overlays use the Popover API, CSS anchor positioning and <Code>&lt;dialog&gt;</Code></Li>
          <Li><Strong>Windows</Strong>: WinUI 3 (XAML) controls hosted in XAML islands through react-native-windows, themed by Fluent and branded from the seed. See the <A href="?path=/docs/guides-windows--docs">Windows guide</A></Li>
        </Ul>

        <H2 id="available-components">Available components</H2>
        <P>
          Everything is exported from <Code>expo-interface</Code>. Value controls are controlled:
          pair <Code>value</Code> with <Code>onValueChange</Code>. Each card below renders the web
          implementation live; use the toolbar to switch between the light and dark scheme and to
          try a different accent color.
        </P>
        <H3 id="layout">Layout</H3>
        <CardGrid entries={layout}/>
        <H3 id="navigation">Navigation</H3>
        <P>
          The navigators need a router around them, so each card below mounts one of its own,
          with a couple of routes in place of an <Code>app/</Code> directory. A whole app is in
          the <A href={EXAMPLE} target="_blank" rel="noopener noreferrer">example</A>.
        </P>
        <CardGrid entries={navigation}/>
        <H3 id="controls">Controls</H3>
        <CardGrid entries={controls}/>
        <H3 id="indicators">Indicators</H3>
        <CardGrid entries={indicators}/>
        <H3 id="overlays">Overlays</H3>
        <CardGrid entries={overlays}/>
      </Page>
    </Providers>
  );
}
