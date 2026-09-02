import type {PropsWithChildren} from 'react';
import {DocsContainer} from '@storybook/addon-docs/blocks';
import type {DocsContainerProps} from '@storybook/addon-docs/blocks';
import {useGlobals, useScheme} from './globals';
import {createTheme, normalizeAccent} from './theme';

/**
 * Docs pages themed from the toolbar globals, like the manager: the scheme
 * choice picks light or dark and the accent seed is the selection color, so
 * an MDX guide flips with the rest of the site (`parameters.docs.theme` is
 * static and could only follow the OS).
 */
export function ThemedDocsContainer({context, children}: PropsWithChildren<DocsContainerProps>) {
  const scheme = useScheme();
  const {accent} = useGlobals();
  return (
    <DocsContainer context={context} theme={createTheme(scheme, normalizeAccent(accent))}>
      {children}
    </DocsContainer>
  );
}
