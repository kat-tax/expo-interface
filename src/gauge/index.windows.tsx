import type {GaugeProps} from './types';
import {StyleSheet, Text, View} from 'react-native';
import XamlProgress from '../windows/specs/ExpoInterfaceProgressNativeComponent';
import {useXamlProps} from '../windows';
import {useColorScheme} from '../scheme';
import {fonts, fontWeights, useColor} from '../theme';
import {fraction, gauge, track} from './shared';

/**
 * Windows redraws the SwiftUI gauge styles the way Android and web do — the
 * same geometry, the accent on the indicator and the value labels — with
 * React Native views for the bars and a WinUI 3 `ProgressRing` in a XAML
 * island for the rings (the platform's own determinate ring, filled to the
 * value; the open `circular` style is drawn as the same ring, its marker
 * being the ring's end).
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
  style,
}: GaugeProps) {
  const f = fraction(value, min, max);
  const scheme = useColorScheme();
  const xaml = useXamlProps();
  const tint = useColor('tint');
  const labelColor = useColor('label');
  const accent = accentColor ?? tint;
  const meter = {
    role: 'progressbar' as const,
    accessibilityLabel: label,
    accessibilityValue: {min, max, now: Math.min(max, Math.max(min, value)), text: currentValueLabel},
  };
  const bound = (text: string | undefined) =>
    text != null ? <Text style={[styles.bound, {color: accent}]}>{text}</Text> : null;

  if (variant === 'circular' || variant === 'circularCapacity') {
    const {size, centerFontSize, centerLineHeight, boundsFontSize, boundsLineHeight} = gauge.ring;
    const text = currentValueLabel ?? label;
    return (
      <View {...meter} style={[styles.ring, {width: size, height: size}, style]} testID={testID}>
        <XamlProgress
          variant="circular"
          value={f}
          size={size}
          color={accent}
          trackColor={variant === 'circularCapacity' ? undefined : 'transparent'}
          style={StyleSheet.absoluteFill}
          {...xaml}
          accentColor={accent}
        />
        {text != null ? (
          <Text
            numberOfLines={1}
            style={[
              styles.center,
              {color: currentValueLabel == null ? labelColor : accent, fontSize: centerFontSize, lineHeight: centerLineHeight},
              currentValueLabel == null && styles.centerLabel,
            ]}>
            {text}
          </Text>
        ) : null}
        {variant === 'circular' && (minimumValueLabel != null || maximumValueLabel != null) ? (
          <View style={styles.ringBounds}>
            <Text style={[styles.ringBound, {color: accent, fontSize: boundsFontSize, lineHeight: boundsLineHeight}]}>{minimumValueLabel ?? ''}</Text>
            <Text style={[styles.ringBound, {color: accent, fontSize: boundsFontSize, lineHeight: boundsLineHeight}]}>{maximumValueLabel ?? ''}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (variant === 'linear') {
    const {bar, dot, knockout} = gauge.linear;
    return (
      <View {...meter} style={[styles.linearRow, style]} testID={testID}>
        {bound(minimumValueLabel)}
        <View style={[styles.track, {height: bar, borderRadius: bar / 2, backgroundColor: track.automatic[scheme]}]}>
          <View style={[styles.marker, {left: `${f * 100}%`, width: knockout, height: knockout, borderRadius: knockout / 2, marginLeft: -knockout / 2, top: (bar - knockout) / 2}]}>
            <View style={{width: dot, height: dot, borderRadius: dot / 2, backgroundColor: accent}}/>
          </View>
        </View>
        {bound(maximumValueLabel)}
      </View>
    );
  }

  const capacity = variant === 'linearCapacity';
  const barHeight = capacity ? gauge.linearCapacity.bar : gauge.automatic.bar;
  const fill = (
    <View style={[styles.track, {height: barHeight, borderRadius: barHeight / 2, backgroundColor: capacity ? track.linearCapacity[scheme] : track.automatic[scheme]}]}>
      <View style={{width: `${f * 100}%`, height: '100%', borderRadius: barHeight / 2, backgroundColor: accent}}/>
    </View>
  );
  return (
    <View {...meter} style={[capacity ? styles.capacity : styles.automatic, style]} testID={testID}>
      {label != null ? <Text style={[styles.label, {color: labelColor}, capacity && styles.leading]}>{label}</Text> : null}
      <View style={styles.linearRow}>
        {bound(minimumValueLabel)}
        {fill}
        {bound(maximumValueLabel)}
      </View>
      {currentValueLabel != null ? (
        <Text style={[capacity ? styles.currentSmall : styles.label, {color: accent}, capacity && styles.leading]}>
          {currentValueLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    fontFamily: fonts.sans,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  ringBounds: {
    position: 'absolute',
    bottom: 0,
    width: gauge.ring.boundsWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringBound: {
    fontFamily: fonts.sans,
  },
  linearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gauge.rowGap,
    alignSelf: 'stretch',
  },
  track: {
    flex: 1,
    overflow: 'visible',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  automatic: {
    alignItems: 'center',
    gap: gauge.automatic.gapBelow,
    alignSelf: 'stretch',
  },
  capacity: {
    gap: gauge.linearCapacity.gap,
    alignSelf: 'stretch',
  },
  leading: {
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: gauge.fontSize,
    lineHeight: gauge.lineHeight,
  },
  currentSmall: {
    fontFamily: fonts.sans,
    fontSize: gauge.linearCapacity.currentFontSize,
    lineHeight: gauge.linearCapacity.currentLineHeight,
  },
  bound: {
    fontFamily: fonts.sans,
    fontSize: gauge.fontSize,
    lineHeight: gauge.lineHeight,
  },
});
