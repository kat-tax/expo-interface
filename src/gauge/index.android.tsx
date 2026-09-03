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
  offset,
  padding,
  rotate,
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
 * Android redraws each SwiftUI gauge style out of Compose primitives (the
 * rings are Material 3 `CircularProgressIndicator`s, the bars clipped
 * `Box`es) with the geometry measured from iOS. The live accent seed tints
 * the indicator and the value labels, matching the iOS tint cascade; the
 * descriptive label keeps the surface text color.
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
      </Box>
    );
  }

  if (variant === 'linear') {
    const {bar, dot, knockout: knock} = gauge.linear;
    return (
      <Row verticalAlignment="center" horizontalArrangement={{spacedBy: gauge.rowGap}} modifiers={[fillMaxWidth(), ...testMods]}>
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
      <Column verticalArrangement={{spacedBy: gap}} modifiers={[fillMaxWidth(), ...testMods]}>
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
    );
  }

  const {bar, gapAbove, gapBelow} = gauge.automatic;
  return (
    <Column horizontalAlignment="center" modifiers={[fillMaxWidth(), ...testMods]}>
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
  );
}
