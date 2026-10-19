import type {GaugeProps} from './types';
import type {ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';

import {useColorScheme} from 'react-native';
import {Box, CircularProgressIndicator, Column, Row, Spacer, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {
  alpha,
  background,
  clip,
  fillMaxHeight,
  fillMaxWidth,
  height,
  matchParentSize,
  offset,
  padding,
  rotate,
  semantics,
  Shapes,
  size,
  testID as testIDModifier,
  weight,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';
import {fraction, gauge, markerOffset, track, withAlpha} from './shared';

const pill = Shapes.RoundedCorner(999);
const circle = Shapes.Circle;
const body = {fontSize: gauge.fontSize, lineHeight: gauge.lineHeight};

/**
 * What TalkBack reads for the gauge: its label and its current value, the
 * current value label or else the fraction as a percentage, as VoiceOver
 * reads a SwiftUI gauge.
 */
const spoken = (label: string | undefined, current: string | undefined, f: number) =>
  [label, current ?? `${Math.round(f * 100)}%`].filter(Boolean).join(', ');

/**
 * Android redraws each SwiftUI gauge style out of Compose primitives (the
 * rings are Material 3 `CircularProgressIndicator`s, the bars clipped
 * `Box`es) with the geometry measured from iOS. The live accent seed tints
 * the indicator and the value labels, matching the iOS tint cascade; the
 * descriptive label keeps the surface text color.
 *
 * The drawing is not what a screen reader is handed: the open ring's arc is
 * a progress indicator held at its 240 degree sweep, which TalkBack would
 * read as 67 percent whatever the value. A childless node laid over it, the
 * last child of a `Box` around the drawing, carries the label and the value
 * as its content description, and Compose leaves out of the tree what a
 * node drawn over it covers, so the arc and the texts are not read as well.
 * `@expo/ui`'s `semantics` carries only a content description, so the value
 * is part of the name rather than a range.
 */
export function Gauge({
  value,
  min = 0,
  max = 1,
  variant = 'automatic',
  label,
  currentValueLabel,
  minimumValueLabel,
  maximumValueLabel,
  accentColor,
  testID,
}: GaugeProps) {
  const colors = useMaterialColors();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tint = useColor('tint');
  const knockout = useColor('background');
  const accent = accentColor ?? tint;
  const f = fraction(value, min, max);
  const testMods: ModifierConfig[] = testID ? [testIDModifier(testID)] : [];
  const cover = <Box modifiers={[matchParentSize(), semantics({contentDescription: spoken(label, currentValueLabel, f)})]}/>;

  const minText = minimumValueLabel != null
    ? <Text color={accent} style={body}>{minimumValueLabel}</Text>
    : null;
  const maxText = maximumValueLabel != null
    ? <Text color={accent} style={body}>{maximumValueLabel}</Text>
    : null;

  if (variant === 'circular' || variant === 'circularCapacity') {
    const {size: ring, stroke} = gauge.ring;
    const center = currentValueLabel ?? label;
    const marker = markerOffset(f);
    return (
      <Box contentAlignment="center" modifiers={[size(ring, ring), ...testMods]}>
        {variant === 'circular' ? (
          <CircularProgressIndicator
            progress={gauge.ring.arcSweep / 360}
            color={accent}
            trackColor="#00000000"
            strokeWidth={stroke}
            strokeCap="round"
            gapSize={0}
            modifiers={[size(ring, ring), rotate(gauge.ring.arcStart - 270)]}
          />
        ) : (
          <CircularProgressIndicator
            progress={f}
            color={accent}
            trackColor={withAlpha(accent, gauge.ring.trackOpacity)}
            strokeWidth={stroke}
            strokeCap="round"
            gapSize={0}
            modifiers={[size(ring, ring)]}
          />
        )}
        {variant === 'circular' ? (
          <Box
            contentAlignment="center"
            modifiers={[
              offset(marker.x, marker.y),
              size(gauge.ring.knockout, gauge.ring.knockout),
              clip(circle),
              background(knockout),
            ]}>
            <Box modifiers={[size(gauge.ring.dot, gauge.ring.dot), clip(circle), background(accent)]}/>
          </Box>
        ) : null}
        {center != null ? (
          <Text
            color={currentValueLabel != null ? accent : colors.onSurface}
            style={{fontSize: gauge.ring.centerFontSize, lineHeight: gauge.ring.centerLineHeight}}>
            {center}
          </Text>
        ) : null}
        {variant === 'circular' && (minText || maxText) ? (
          <Row
            horizontalArrangement="spaceBetween"
            verticalAlignment="center"
            modifiers={[offset(0, gauge.ring.boundsOffset), width(gauge.ring.boundsWidth)]}>
            {minimumValueLabel != null ? (
              <Text color={accent} style={{fontSize: gauge.ring.boundsFontSize, lineHeight: gauge.ring.boundsLineHeight}}>
                {minimumValueLabel}
              </Text>
            ) : <Spacer/>}
            {maximumValueLabel != null ? (
              <Text color={accent} style={{fontSize: gauge.ring.boundsFontSize, lineHeight: gauge.ring.boundsLineHeight}}>
                {maximumValueLabel}
              </Text>
            ) : <Spacer/>}
          </Row>
        ) : null}
        {cover}
      </Box>
    );
  }

  if (variant === 'linear') {
    const {bar, dot, knockout: knock} = gauge.linear;
    return (
      <Box modifiers={[fillMaxWidth(), ...testMods]}>
        <Row verticalAlignment="center" horizontalArrangement={{spacedBy: gauge.rowGap}} modifiers={[fillMaxWidth()]}>
          {minText}
          <Box contentAlignment="centerStart" modifiers={[weight(1), height(knock)]}>
            <Box modifiers={[fillMaxWidth(), height(bar), clip(pill), background(accent)]}/>
            <Box modifiers={[fillMaxWidth(), fillMaxHeight(), padding(dot / 2, 0, dot / 2, 0)]}>
              <Box contentAlignment="centerEnd" modifiers={[fillMaxWidth(f), fillMaxHeight()]}>
                <Box
                  contentAlignment="center"
                  modifiers={[offset(knock / 2, 0), size(knock, knock), clip(circle), background(knockout)]}>
                  <Box modifiers={[size(dot, dot), clip(circle), background(accent)]}/>
                </Box>
              </Box>
            </Box>
          </Box>
          {maxText}
        </Row>
        {cover}
      </Box>
    );
  }

  if (variant === 'linearCapacity') {
    const {bar, gap} = gauge.linearCapacity;
    // Invisible copy of the bounds label so the stacked label and current
    // value start at the bar's leading edge, as the SwiftUI layout does.
    const ghost = minimumValueLabel != null
      ? <Text style={body} modifiers={[alpha(0)]}>{minimumValueLabel}</Text>
      : null;
    return (
      <Box modifiers={[fillMaxWidth(), ...testMods]}>
        <Column verticalArrangement={{spacedBy: gap}} modifiers={[fillMaxWidth()]}>
          {label != null ? (
            <Row horizontalArrangement={{spacedBy: gauge.rowGap}}>
              {ghost}
              <Text color={colors.onSurface} style={body}>{label}</Text>
            </Row>
          ) : null}
          <Row verticalAlignment="center" horizontalArrangement={{spacedBy: gauge.rowGap}} modifiers={[fillMaxWidth()]}>
            {minText}
            <Box contentAlignment="centerStart" modifiers={[weight(1), height(bar), clip(pill), background(track.linearCapacity[scheme])]}>
              <Box modifiers={[fillMaxWidth(f), fillMaxHeight(), clip(pill), background(accent)]}/>
            </Box>
            {maxText}
          </Row>
          {currentValueLabel != null ? (
            <Row horizontalArrangement={{spacedBy: gauge.rowGap}}>
              {ghost}
              <Text
                color={accent}
                style={{fontSize: gauge.linearCapacity.currentFontSize, lineHeight: gauge.linearCapacity.currentLineHeight}}>
                {currentValueLabel}
              </Text>
            </Row>
          ) : null}
        </Column>
        {cover}
      </Box>
    );
  }

  const {bar, gapAbove, gapBelow} = gauge.automatic;
  return (
    <Box modifiers={[fillMaxWidth(), ...testMods]}>
      <Column horizontalAlignment="center" modifiers={[fillMaxWidth()]}>
        {label != null ? (
          <>
            <Text color={colors.onSurface} style={body}>{label}</Text>
            <Spacer modifiers={[height(gapAbove)]}/>
          </>
        ) : null}
        <Row verticalAlignment="center" horizontalArrangement={{spacedBy: gauge.rowGap}} modifiers={[fillMaxWidth()]}>
          {minText}
          <Box contentAlignment="centerStart" modifiers={[weight(1), height(bar), clip(pill), background(track.automatic[scheme])]}>
            <Box modifiers={[fillMaxWidth(f), fillMaxHeight(), clip(pill), background(accent)]}/>
          </Box>
          {maxText}
        </Row>
        {currentValueLabel != null ? (
          <>
            <Spacer modifiers={[height(gapBelow)]}/>
            <Text color={accent} style={body}>{currentValueLabel}</Text>
          </>
        ) : null}
      </Column>
      {cover}
    </Box>
  );
}
