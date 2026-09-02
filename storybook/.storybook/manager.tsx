import React, {useState} from 'react';
import {addons, types, useGlobals} from 'storybook/manager-api';
import {IconButton, WithTooltip} from 'storybook/internal/components';
import {GLOBALS_UPDATED, SET_GLOBALS} from 'storybook/internal/core-events';
import {styled} from 'storybook/theming';
import type {StorybookTheme} from 'storybook/theming';
import {ACCENT_PRESETS, normalizeAccent, onPrefersDarkChange, themeFor} from './theme';
import type {ThemeGlobals} from './theme';

addons.setConfig({
  theme: themeFor(),
  sidebar: {
    showRoots: true,
  },
});

/**
 * Keeps the manager's theme in step with the preview: the toolbar's scheme
 * choice (`system` follows the OS) picks light or dark, and the accent seed
 * becomes the selection color. The docs pages do the same in the preview
 * (see `docs-container.tsx`).
 */
addons.register('expo-interface/theme', api => {
  let globals: ThemeGlobals = {};
  const apply = () => api.setOptions({theme: themeFor(globals)});
  const onGlobals = ({globals: next}: {globals: ThemeGlobals}) => {
    globals = next;
    apply();
  };
  api.on(SET_GLOBALS, onGlobals);
  api.on(GLOBALS_UPDATED, onGlobals);
  onPrefersDarkChange(apply);

  addons.add('expo-interface/accent', {
    type: types.TOOL,
    title: 'Accent',
    match: ({viewMode, tabId}) => !tabId && (viewMode === 'story' || viewMode === 'docs'),
    render: () => <AccentTool/>,
  });
});

/** Toolbar button that opens the accent picker. */
function AccentTool() {
  const [globals, updateGlobals] = useGlobals();
  const accent = normalizeAccent(globals.accent);
  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnOutsideClick
      tooltip={<AccentPicker value={accent} onChange={value => updateGlobals({accent: value})}/>}
    >
      <IconButton title="Accent color">
        <Swatch style={{background: accent}}/>
      </IconButton>
    </WithTooltip>
  );
}

function AccentPicker({value, onChange}: {value: string; onChange: (value: string) => void}) {
  // The native color input reports every drag step; keep its own value so
  // the text next to it tracks the drag even before the globals round-trip.
  const [custom, setCustom] = useState(value);
  const isPreset = ACCENT_PRESETS.some(preset => preset.value === value);
  const pick = (next: string) => {
    const hex = normalizeAccent(next);
    setCustom(hex);
    onChange(hex);
  };
  return (
    <Panel>
      <Heading>Accent</Heading>
      <Grid>
        {ACCENT_PRESETS.map(preset => (
          <Preset
            key={preset.value}
            type="button"
            title={`${preset.name} ${preset.value}`}
            aria-label={preset.name}
            aria-pressed={preset.value === value}
            style={{background: preset.value}}
            onClick={() => pick(preset.value)}
          />
        ))}
      </Grid>
      <Custom>
        <Preset
          as="span"
          aria-pressed={!isPreset}
          style={{background: isPreset ? value : custom}}
        >
          <input
            type="color"
            aria-label="Custom accent"
            value={(isPreset ? value : custom).toLowerCase()}
            onChange={event => pick(event.currentTarget.value)}
          />
        </Preset>
        <Label>
          <span>Custom</span>
          <code>{value}</code>
        </Label>
      </Custom>
    </Panel>
  );
}

/** Hairline rim that separates a color circle from the panel behind it. */
const rim = (theme: StorybookTheme) =>
  `1px solid ${theme.base === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.25)'}`;

const Swatch = styled.span(({theme}) => ({
  display: 'block',
  boxSizing: 'border-box',
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: rim(theme),
}));

const Panel = styled.div({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  width: 196,
});

const Heading = styled.div(({theme}) => ({
  fontSize: theme.typography.size.s1,
  fontWeight: theme.typography.weight.bold,
  color: theme.textMutedColor,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}));

const Grid = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8,
});

const Preset = styled.button(({theme}) => ({
  position: 'relative',
  display: 'block',
  width: 28,
  height: 28,
  boxSizing: 'border-box',
  padding: 0,
  border: rim(theme),
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'transform 0.1s ease-out',
  '&:hover': {transform: 'scale(1.1)'},
  '&:focus-visible': {outline: `2px solid ${theme.color.secondary}`, outlineOffset: 2},
  '&[aria-pressed="true"]': {
    boxShadow: `0 0 0 2px ${theme.background.content}, 0 0 0 4px ${theme.color.secondary}`,
  },
  // The native color input fills the swatch invisibly, so the whole circle
  // opens the platform picker.
  '& input': {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
}));

const Custom = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

const Label = styled.div(({theme}) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: theme.typography.size.s2,
  color: theme.color.defaultText,
  '& code': {
    fontFamily: theme.typography.fonts.mono,
    fontSize: theme.typography.size.s1,
    color: theme.textMutedColor,
  },
}));
