import {styled} from 'storybook/theming';
import type {StorybookTheme} from 'storybook/theming';

/**
 * Typography and layout primitives for the Overview page, mirroring the
 * Expo docs (`docs.expo.dev/versions/v57.0.0/sdk/ui`): Inter, a 31px bold
 * title, 25px/20px section headings, 16px body copy and pill badges. Colors
 * come from the Storybook theme (`.storybook/theme.ts`), which already
 * follows the toolbar's scheme and accent, so the page flips with the site.
 */

/** Raised surface behind badges, inline code and hovered buttons. */
export const raised = (theme: StorybookTheme) => theme.background.hoverable;

export const Page = styled.article(({theme}) => ({
  containerType: 'inline-size',
  fontFamily: theme.typography.fonts.base,
  color: theme.color.defaultText,
  fontSize: 16,
  lineHeight: 1.625,
  WebkitFontSmoothing: 'antialiased',
  '& *, & *::before, & *::after': {boxSizing: 'border-box'},
}));

export const Header = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginTop: 8,
});

export const H1 = styled.h1({
  margin: 0,
  fontSize: 31,
  lineHeight: 1.29,
  fontWeight: 700,
  letterSpacing: '-0.022rem',
  '@container (max-width: 767px)': {fontSize: 27, lineHeight: 1.3333},
  '@container (max-width: 639px)': {fontSize: 23, lineHeight: 1.3913},
});

export const Description = styled.p(({theme}) => ({
  margin: '8px 0 0',
  fontSize: 16,
  fontWeight: 400,
  color: theme.textMutedColor,
}));

export const Badges = styled.div({
  display: 'inline-flex',
  flexWrap: 'wrap',
  rowGap: 6,
  marginTop: 16,
});

export const Badge = styled.span(({theme}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minHeight: 21,
  marginRight: 8,
  padding: '2px 7px',
  borderRadius: 9999,
  border: `1px solid ${theme.appBorderColor}`,
  background: raised(theme),
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  '&:last-of-type': {marginRight: 0},
  '& svg': {width: 14, height: 14, flexShrink: 0, color: theme.textMutedColor},
}));

export const Toolbar = styled.div(({theme}) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 16,
  paddingBottom: 4,
  '@container (max-width: 767px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    paddingBottom: 0,
    '& > *': {padding: '12px 0', justifyContent: 'space-between'},
    '& > *:first-of-type': {borderBottom: `1px solid ${theme.appBorderColor}`},
  },
}));

export const ToolbarGroup = styled.div({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
});

/** Quaternary pill button: GitHub, npm and Changelog links. */
export const ToolButton = styled.a(({theme}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 36,
  padding: '0 10px',
  borderRadius: 9999,
  border: '1px solid transparent',
  background: 'transparent',
  color: theme.textMutedColor,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, transform 0.15s ease',
  '&:hover, &:focus-visible': {background: raised(theme), color: theme.textMutedColor},
  '&:active': {transform: 'scale(0.98)'},
  '& svg': {width: 16, height: 16, flexShrink: 0, color: theme.color.defaultText},
}));

export const Version = styled.div(({theme}) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  color: theme.textMutedColor,
  '& svg': {width: 16, height: 16, color: theme.color.defaultText},
}));

export const Rule = styled.hr(({theme}) => ({
  height: 1,
  margin: '0 0 24px',
  border: 0,
  background: theme.appBorderColor,
  '@container (max-width: 767px)': {display: 'none'},
}));

export const P = styled.p({
  margin: '0 0 13px',
  fontSize: 16,
  fontWeight: 400,
  overflowWrap: 'break-word',
});

export const Code = styled.code(({theme}) => ({
  display: 'inline-block',
  padding: '2px 4px',
  borderRadius: 6,
  border: `1px solid ${theme.appBorderColor}`,
  background: raised(theme),
  fontFamily: theme.typography.fonts.mono,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '130%',
  color: 'inherit',
  'h2 &, h3 &': {fontSize: '90%'},
}));

export const A = styled.a(({theme}) => ({
  color: theme.color.secondary,
  fontWeight: 400,
  textDecoration: 'none',
  cursor: 'pointer',
  '&:hover, &:focus-visible': {textDecoration: 'underline', opacity: 0.8},
  '& code': {color: theme.color.secondary},
}));

export const Strong = styled.strong({
  fontWeight: 600,
});

export const H2 = styled.h2({
  margin: '32px 0 14px',
  fontSize: 25,
  lineHeight: 1.4,
  fontWeight: 700,
  letterSpacing: '-0.021rem',
  scrollMarginTop: 20,
  '@container (max-width: 767px)': {fontSize: 22, lineHeight: 1.409},
  '@container (max-width: 639px)': {fontSize: 19, lineHeight: 1.5263},
});

export const H3 = styled.h3({
  margin: '28px 0 12px',
  fontSize: 20,
  lineHeight: 1.5,
  fontWeight: 600,
  letterSpacing: '-0.017rem',
  scrollMarginTop: 20,
  '@container (max-width: 767px)': {fontSize: 18, lineHeight: 1.5555},
  '@container (max-width: 639px)': {fontSize: 16, lineHeight: 1.625},
});

export const Ul = styled.ul({
  margin: '0 0 13px',
  padding: '0 0 0 1ch',
  marginLeft: 24,
  listStyle: 'disc',
  lineHeight: 1.6154,
});

export const Li = styled.li({
  marginBottom: 8,
  fontSize: 16,
  lineHeight: 1.625,
  fontWeight: 400,
});
