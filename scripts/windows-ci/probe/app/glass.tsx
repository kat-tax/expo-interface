/**
 * `expo-glass-effect` on Windows: glass views drawn on acrylic islands with
 * React Native content inside them through the portal, over a two-colour
 * background so the material can be told from a plain fill. The ids are what
 * the Windows checks look for.
 */
import {useState} from 'react';
import {View} from 'react-native';
import {GlassContainer, GlassView, isLiquidGlassAvailable} from 'expo-glass-effect';
import {Body, Button, Screen, Title} from 'expo-interface';

export default function GlassProbe() {
  const [presses, setPresses] = useState(0);
  return (
    <Screen>
      <Title>Glass</Title>
      <Body testID="state">{`available ${isLiquidGlassAvailable()} · presses ${presses}`}</Body>
      <View testID="behind" style={{width: 360, backgroundColor: '#1B5E20', padding: 20}}>
        <View style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 180, backgroundColor: '#E65100'}}/>
        <GlassContainer spacing={8} style={{gap: 12}}>
          <GlassView testID="regular" style={{padding: 12, gap: 8}}>
            <Body testID="regular-text">Regular acrylic.</Body>
            <Button testID="glass-button" label={`Press ${presses}`} onPress={() => setPresses(count => count + 1)}/>
          </GlassView>
          <GlassView testID="clear" glassEffectStyle="clear" tintColor="rgba(255, 0, 0, 0.25)" style={{padding: 12}}>
            <Body testID="clear-text">Thin acrylic, tinted red.</Body>
          </GlassView>
        </GlassContainer>
      </View>
    </Screen>
  );
}
