import type {MouseEvent, PropsWithChildren, ReactNode} from 'react';
import type {ViewStyle} from 'react-native';
import {useContext, useLayoutEffect, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {Host} from '@expo/ui';
import {DocsContext} from '@storybook/addon-docs/blocks';
import {NAVIGATE_URL} from 'storybook/internal/core-events';
import {styled} from 'storybook/theming';
import {hostAccentProps, useAccentSeed} from 'expo-interface';
import {ArrowRightIcon} from './icons';
import {A} from './styles';

/**
 * The component grid from the Expo UI docs: three columns of linked cards,
 * each a preview above a name-and-arrow footer. Expo shows a light or dark
 * screenshot per card; here the preview is the kit's own web implementation,
 * rendered live (so it follows the scheme *and* the accent) but inert, so the
 * whole card stays a link to the component's docs page.
 */

export interface CardEntry {
  /** Export name, shown in the footer. */
  name: string;
  /** Docs page, as a manager URL (`?path=/docs/…`). */
  href: string;
  /** Live preview rendered in the card. */
  preview: ReactNode;
  /** How the preview is laid out on the stage. */
  stage?: StageLayout;
  /** Dim the area behind the preview, like a modal's `::backdrop`. */
  backdrop?: boolean;
}

export type StageLayout = 'column' | 'center' | 'device';

/** Three columns, two under ~720px of container width, one under ~460px. */
export const Grid = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16,
  margin: '20px 0',
  '@container (max-width: 719px)': {gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'},
  '@container (max-width: 459px)': {gridTemplateColumns: 'minmax(0, 1fr)'},
});

const Link = styled.a(({theme}) => ({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 8,
  border: `1px solid ${theme.appBorderColor}`,
  background: theme.background.content,
  color: theme.color.defaultText,
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
  '&:hover, &:focus-visible': {
    opacity: 0.8,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  '&:focus-visible': {outline: `2px solid ${theme.color.secondary}`, outlineOffset: 2},
  '&:hover [data-stage], &:focus-visible [data-stage]': {transform: 'scale(1.05)'},
}));

/**
 * The preview area: the Expo card's image box, at the screenshots' aspect
 * ratio and on their grey. The kit's surface tokens are remapped inside so a
 * grouped section or menu still reads as a raised surface on that grey (the
 * default `backgroundElement` is nearly the same shade).
 */
const Preview = styled.div(({theme}) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  aspectRatio: '918 / 631',
  background: theme.base === 'dark' ? '#222222' : '#F1F1F3',
  '--color-background': theme.base === 'dark' ? '#222222' : '#F1F1F3',
  '--color-background-element': theme.base === 'dark' ? '#2C2C2E' : '#FFFFFF',
  '--color-background-selected': theme.base === 'dark' ? '#3A3A3C' : '#E0E1E6',
  '--color-pill-background': theme.base === 'dark' ? 'rgba(118, 118, 128, 0.32)' : 'rgba(118, 118, 128, 0.14)',
}));

/**
 * Fills the preview area and carries the hover transform. The `device`
 * layout scales from the bottom edge, where its frame sits.
 */
const Stage = styled.div<{layout: StageLayout}>(({layout}) => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  transition: 'transform 0.15s ease',
  transformOrigin: layout === 'device' ? 'bottom center' : 'center',
}));

/**
 * Previews are laid out at one reference size (a third of the Expo
 * screenshots, which is the card width at the docs page's full width) and
 * scaled to the card, so a narrow column shrinks the whole picture instead of
 * wrapping its text, like an image would.
 */
const CANVAS = {width: 306, height: 306 * (631 / 918)};

const Canvas = styled.div({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: CANVAS.width,
  height: CANVAS.height,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/** Ratio of the preview area's width to the canvas, kept up to date on resize. */
function usePreviewScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / CANVAS.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, scale] as const;
}

/**
 * The `@expo/ui` `Host` each story gets from the `Frame` decorator: on web it
 * injects the `--expo-ui-*` palette that `FieldGroup` and friends read, and
 * carries the accent seed. It is also the preview's layout box.
 */
const hostLayouts = StyleSheet.create<Record<StageLayout, ViewStyle>>({
  column: {
    width: '78%',
    maxWidth: 280,
    alignItems: 'stretch',
    gap: 12,
  },
  center: {
    width: '78%',
    maxWidth: 280,
    alignItems: 'center',
    gap: 12,
  },
  // A phone-like frame rising from the bottom edge, for screen-level layouts.
  device: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    top: 24,
    bottom: -2,
    alignItems: 'stretch',
  },
});

const Backdrop = styled.div({
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
});

const Footer = styled.span(({theme}) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: 16,
  borderTop: `1px solid ${theme.appBorderColor}`,
  fontSize: 15,
  fontWeight: 500,
  lineHeight: 1.6,
  letterSpacing: '-0.009rem',
  '& svg': {flexShrink: 0, color: theme.textMutedColor},
}));

/** Like the MDX anchors: same-Storybook links go through the manager. */
function useDocsNavigation(href: string) {
  const context = useContext(DocsContext);
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    context.channel.emit(NAVIGATE_URL, href);
  };
}

/** Inline link to another docs page, routed through the manager. */
export function DocsLink({href, children}: PropsWithChildren<{href: string}>) {
  const onClick = useDocsNavigation(href);
  return <A href={href} onClick={onClick}>{children}</A>;
}

export function Card({name, href, stage = 'column', backdrop, children}: PropsWithChildren<Omit<CardEntry, 'preview'>>) {
  const onClick = useDocsNavigation(href);
  const seed = useAccentSeed();
  const [preview, scale] = usePreviewScale();
  return (
    <Link href={href} onClick={onClick}>
      <Preview ref={preview}>
        {backdrop ? <Backdrop/> : null}
        <Stage layout={stage} data-stage="" inert aria-hidden="true">
          <Canvas style={{transform: `translate(-50%, -50%) scale(${scale})`}}>
            <Host style={hostLayouts[stage]} {...hostAccentProps(seed)}>
              {children}
            </Host>
          </Canvas>
        </Stage>
      </Preview>
      <Footer>
        {name}
        <ArrowRightIcon/>
      </Footer>
    </Link>
  );
}

export function CardGrid({entries}: {entries: CardEntry[]}) {
  return (
    <Grid>
      {entries.map(({name, href, preview, stage, backdrop}) => (
        <Card key={name} name={name} href={href} stage={stage} backdrop={backdrop}>
          {preview}
        </Card>
      ))}
    </Grid>
  );
}
