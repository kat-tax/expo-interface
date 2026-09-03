import type {GestureResponderEvent, LayoutChangeEvent} from 'react-native';
import type {RGBA} from './shared';

import {useCallback, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, useColorScheme, View} from 'react-native';
import {Image} from 'expo-image';
import {fonts, fontWeights, useColor} from '../theme';
import {
  checkerSvg,
  grid,
  gridColor,
  parseColor,
  spectrumColor,
  spectrumPosition,
  spectrumSvg,
  svgDataUri,
  toCss,
  toHex,
  useColorValue,
} from './shared';

/**
 * The iOS system color picker (`UIColorPickerViewController`) redrawn with
 * React Native views, shown in a bottom sheet on Android and web. A title
 * row with a close button, a Grid / Spectrum / Sliders segmented control, an
 * opacity slider and a footer with the preview swatch and saved colors.
 * The spectrum and the checkerboard are static SVGs; the slider tracks are
 * bands of solid segments, so dragging never decodes an image.
 */
export interface ColorPickerSheetProps {
  /** Title of the picker, the row's label on iOS. */
  title: string;
  /** Selected color as `#RRGGBB` or `#RRGGBBAA`. */
  value: string;
  /** Shows the opacity slider. */
  supportsOpacity: boolean;
  /** Called with the new hex whenever the user picks a color. */
  onValueChange: (hex: string) => void;
  /** Called from the close button. */
  onClose: () => void;
  /** Fixed content width (Android sizes the hosted React Native tree from its content). */
  width?: number;
  /** Identifier used to locate the sheet in end-to-end tests. */
  testID?: string;
}

export type ColorPickerTab = 'grid' | 'spectrum' | 'sliders';

const TABS: {value: ColorPickerTab; label: string}[] = [
  {value: 'grid', label: 'Grid'},
  {value: 'spectrum', label: 'Spectrum'},
  {value: 'sliders', label: 'Sliders'},
];

const SPECTRUM = svgDataUri(spectrumSvg());
const CHECKER = svgDataUri(checkerSvg());
const THUMB = 28;
const TRACK = 36;
const THUMB_INSET = (TRACK - THUMB) / 2;
const SEGMENTS = 32;
const HANDLE = 28;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Colors the user saved with the `+` button, shared by every picker for the session. */
let savedColors: RGBA[] = [];

const responder = (handler: (x: number, y: number) => void) => ({
  onStartShouldSetResponder: () => true,
  onMoveShouldSetResponder: () => true,
  onResponderTerminationRequest: () => false,
  onResponderGrant: (event: GestureResponderEvent) => handler(event.nativeEvent.locationX, event.nativeEvent.locationY),
  onResponderMove: (event: GestureResponderEvent) => handler(event.nativeEvent.locationX, event.nativeEvent.locationY),
});

export function ColorPickerSheet({title, value, supportsOpacity, onValueChange, onClose, width, testID}: ColorPickerSheetProps) {
  const [tab, setTab] = useState<ColorPickerTab>('grid');
  const [color, setColor] = useColorValue(value, onValueChange, supportsOpacity);
  const [saved, setSaved] = useState(savedColors);
  const label = useColor('label');
  const secondary = useColor('secondaryLabel');
  const fill = useColor('pillBackground');
  const separator = useColor('separator');
  const css = toCss(color);

  const save = () => {
    savedColors = [...savedColors, color];
    setSaved(savedColors);
  };

  return (
    <View style={[styles.sheet, width != null ? {width} : styles.fill]} testID={testID}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: label}]} numberOfLines={1} role="heading" accessible>{title}</Text>
        <Pressable
          role="button"
          aria-label="Close"
          onPress={onClose}
          style={[styles.close, {backgroundColor: fill}]}>
          <Text style={[styles.closeGlyph, {color: secondary}]}>✕</Text>
        </Pressable>
      </View>
      <Tabs value={tab} onChange={setTab}/>
      <View style={styles.section}>
        {tab === 'grid' ? <Grid color={color} onChange={setColor}/> : null}
        {tab === 'spectrum' ? <Spectrum color={color} onChange={setColor}/> : null}
        {tab === 'sliders' ? <Sliders color={color} onChange={setColor}/> : null}
      </View>
      {supportsOpacity ? (
        <View style={styles.section}>
          <Text style={[styles.caption, {color: secondary}]}>OPACITY</Text>
          <View style={styles.sliderRow}>
            <Slider
              label="Opacity"
              value={color.a}
              checkered
              colorAt={t => toCss({...color, a: t})}
              onChange={a => setColor({...color, a})}
            />
            <Field
              label="Opacity percent"
              value={`${Math.round(color.a * 100)}%`}
              onCommit={text => setColor({...color, a: clamp(parseFloat(text) || 0, 0, 100) / 100})}
            />
          </View>
        </View>
      ) : null}
      <View style={[styles.divider, {backgroundColor: separator}]}/>
      <View style={styles.footer}>
        <View style={styles.preview} aria-label={`Selected color ${toHex(color, supportsOpacity)}`}>
          {color.a < 1 ? <Image source={{uri: CHECKER}} style={StyleSheet.absoluteFill} contentFit="cover"/> : null}
          <View style={[StyleSheet.absoluteFill, {backgroundColor: css}]}/>
        </View>
        <View style={styles.saved}>
          {saved.map((entry, index) => (
            <Pressable
              key={`${toHex(entry, true)}-${index}`}
              role="button"
              aria-label={`Saved color ${toHex(entry, true)}`}
              onPress={() => setColor(entry)}
              style={[styles.swatch, {backgroundColor: toCss(entry)}]}
            />
          ))}
          <Pressable
            role="button"
            aria-label="Save color"
            onPress={save}
            style={[styles.swatch, {backgroundColor: fill}]}>
            <Text style={[styles.plus, {color: secondary}]}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Tabs({value, onChange}: {value: ColorPickerTab; onChange: (tab: ColorPickerTab) => void}) {
  const dark = useColorScheme() === 'dark';
  const label = useColor('label');
  const fill = useColor('pillBackground');
  return (
    <View style={[styles.tabs, {backgroundColor: fill}]} role="radiogroup" aria-label="Picker">
      {TABS.map(tab => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            role="radio"
            aria-label={`${tab.label} tab`}
            aria-checked={selected}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, selected && [styles.tabSelected, {backgroundColor: dark ? '#636366' : '#ffffff'}]]}>
            <Text style={[styles.tabLabel, {color: label}, selected && styles.tabLabelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Grid({color, onChange}: {color: RGBA; onChange: (next: RGBA) => void}) {
  const rows = Array.from({length: grid.rows}, (_, row) =>
    Array.from({length: grid.columns}, (_, column) => gridColor(row, column)),
  );
  return (
    <View style={styles.grid}>
      {rows.map((cells, row) => (
        <View key={row} style={styles.gridRow}>
          {cells.map((cell, column) => {
            const selected = cell.r === color.r && cell.g === color.g && cell.b === color.b;
            return (
              <Pressable
                key={column}
                role="button"
                aria-label={`Color ${toHex({...cell, a: 1}, false)}`}
                aria-selected={selected}
                onPress={() => onChange({...cell, a: color.a})}
                style={[styles.gridCell, {backgroundColor: toCss({...cell, a: 1})}]}>
                {selected ? <View style={styles.gridSelected}/> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Spectrum({color, onChange}: {color: RGBA; onChange: (next: RGBA) => void}) {
  const [size, setSize] = useState({width: 0, height: 0});
  const position = spectrumPosition(color);
  const pick = (x: number, y: number) => {
    if (!size.width || !size.height) return;
    onChange({...spectrumColor(x / size.width, y / size.height), a: color.a});
  };
  return (
    <View
      {...responder(pick)}
      role="slider"
      aria-label="Spectrum"
      aria-valuetext={toHex(color, false)}
      onLayout={(event: LayoutChangeEvent) => setSize(event.nativeEvent.layout)}
      style={styles.spectrum}>
      <Image source={{uri: SPECTRUM}} style={StyleSheet.absoluteFill} contentFit="fill"/>
      {size.width > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.handle,
            {
              left: clamp(position.x * size.width, HANDLE / 2, size.width - HANDLE / 2) - HANDLE / 2,
              top: clamp(position.y * size.height, HANDLE / 2, size.height - HANDLE / 2) - HANDLE / 2,
              backgroundColor: toCss({...color, a: 1}),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const CHANNELS = ['r', 'g', 'b'] as const;
const CHANNEL_NAMES = {r: 'Red', g: 'Green', b: 'Blue'} as const;

function Sliders({color, onChange}: {color: RGBA; onChange: (next: RGBA) => void}) {
  const secondary = useColor('secondaryLabel');
  return (
    <View style={styles.sliders}>
      {CHANNELS.map(channel => (
        <View key={channel}>
          <Text style={[styles.caption, {color: secondary}]}>{CHANNEL_NAMES[channel].toUpperCase()}</Text>
          <View style={styles.sliderRow}>
            <Slider
              label={CHANNEL_NAMES[channel]}
              value={color[channel] / 255}
              colorAt={t => toCss({...color, a: 1, [channel]: t * 255})}
              onChange={t => onChange({...color, [channel]: Math.round(t * 255)})}
            />
            <Field
              label={`${CHANNEL_NAMES[channel]} value`}
              value={String(color[channel])}
              onCommit={text => onChange({...color, [channel]: clamp(Math.round(Number(text)) || 0, 0, 255)})}
            />
          </View>
        </View>
      ))}
      <View style={styles.hexRow}>
        <Text style={[styles.caption, styles.hexCaption, {color: secondary}]}>Display P3 Hex Color #</Text>
        <Field
          label="Hex color"
          value={toHex(color, false).slice(1)}
          wide
          onCommit={text => {
            if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(text)) return;
            onChange({...parseColor(text), a: color.a});
          }}
        />
      </View>
    </View>
  );
}

interface SliderProps {
  label: string;
  /** Position `0…1`. */
  value: number;
  /** Color of the track at a position `0…1`. */
  colorAt: (t: number) => string;
  /** Draws a checkerboard under the track (for translucent colors). */
  checkered?: boolean;
  onChange: (value: number) => void;
}

/** A pill track banded with `SEGMENTS` solid colors and a ringed thumb, like the iOS color sliders. */
function Slider({label, value, colorAt, checkered, onChange}: SliderProps) {
  const [width, setWidth] = useState(0);
  // The thumb travels inside the pill, inset by the ring around it.
  const travel = Math.max(0, width - THUMB - 2 * THUMB_INSET);
  const pick = (x: number) => {
    if (!travel) return;
    onChange(clamp((x - THUMB_INSET - THUMB / 2) / travel, 0, 1));
  };
  return (
    <View
      {...responder(pick)}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={styles.track}>
      {checkered ? <Image source={{uri: CHECKER}} style={StyleSheet.absoluteFill} contentFit="cover"/> : null}
      <View style={styles.band} pointerEvents="none">
        {Array.from({length: SEGMENTS}, (_, i) => (
          <View key={i} style={[styles.segment, {backgroundColor: colorAt((i + 0.5) / SEGMENTS)}]}/>
        ))}
      </View>
      {width > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.thumb, {left: THUMB_INSET + value * travel, backgroundColor: colorAt(value)}]}
        />
      ) : null}
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  wide?: boolean;
  /** Called with the typed text when editing ends or the return key is pressed. */
  onCommit: (text: string) => void;
}

/** Rounded value box that commits when editing ends, like the iOS picker's fields. */
function Field({label, value, wide, onCommit}: FieldProps) {
  const [text, setText] = useState(value);
  // Follow the picked color while the field is not being edited.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setText(value);
  }
  const fill = useColor('pillBackground');
  const color = useColor('label');
  const commit = useCallback(() => onCommit(text), [onCommit, text]);
  return (
    <TextInput
      aria-label={label}
      value={text}
      onChangeText={setText}
      onSubmitEditing={commit}
      onBlur={commit}
      selectTextOnFocus
      style={[styles.field, wide && styles.fieldWide, {backgroundColor: fill, color}]}
    />
  );
}

const styles = StyleSheet.create({
  sheet: {gap: 16},
  fill: {alignSelf: 'stretch'},
  header: {height: 44, alignItems: 'center', justifyContent: 'center'},
  title: {
    fontFamily: fonts?.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: fontWeights.semibold,
    marginHorizontal: 40,
    textAlign: 'center',
  },
  close: {position: 'absolute', right: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  closeGlyph: {fontFamily: fonts?.sans, fontSize: 15, lineHeight: 18, fontWeight: fontWeights.bold},
  tabs: {flexDirection: 'row', padding: 2, borderRadius: 9},
  tab: {flex: 1, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center'},
  tabSelected: {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
  },
  tabLabel: {fontFamily: fonts?.sans, fontSize: 13, lineHeight: 18, fontWeight: fontWeights.medium},
  tabLabelSelected: {fontWeight: fontWeights.semibold},
  section: {gap: 8},
  caption: {fontFamily: fonts?.sans, fontSize: 13, lineHeight: 18, fontWeight: fontWeights.normal, letterSpacing: 0.3},
  grid: {aspectRatio: grid.columns / grid.rows, borderRadius: 10, overflow: 'hidden'},
  gridRow: {flex: 1, flexDirection: 'row'},
  gridCell: {flex: 1},
  gridSelected: {flex: 1, borderWidth: 3, borderColor: '#ffffff', outlineWidth: 1, outlineColor: 'rgba(0, 0, 0, 0.35)', outlineOffset: -1},
  spectrum: {aspectRatio: 361 / 337, borderRadius: 10, overflow: 'hidden'},
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
  },
  sliders: {gap: 12},
  sliderRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  track: {flex: 1, height: TRACK, borderRadius: TRACK / 2, overflow: 'hidden'},
  band: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row'},
  segment: {flex: 1},
  thumb: {
    position: 'absolute',
    top: (TRACK - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
  },
  field: {
    width: 72,
    height: TRACK,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontFamily: fonts?.sans,
    fontSize: 17,
    textAlign: 'center',
  },
  fieldWide: {width: 112},
  hexRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  hexCaption: {flexShrink: 1},
  divider: {height: StyleSheet.hairlineWidth},
  footer: {flexDirection: 'row', gap: 16},
  preview: {width: 72, height: 72, borderRadius: 12, overflow: 'hidden'},
  saved: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start'},
  swatch: {width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  plus: {fontFamily: fonts?.sans, fontSize: 20, lineHeight: 24, fontWeight: fontWeights.medium},
});
