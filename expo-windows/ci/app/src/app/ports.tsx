/**
 * The community packages with a Windows port of their own, at work: a
 * value kept and read back by `@react-native-async-storage/async-storage`,
 * the connection `@react-native-community/netinfo` sees, a drawing by
 * `react-native-svg`, and a list by `@shopify/flash-list`. Each has
 * native code the Windows CI app autolinks and builds; this route shows
 * them answering.
 */
import {useEffect, useState} from 'react';
import {View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetch as fetchNetwork} from '@react-native-community/netinfo';
import {FlashList} from '@shopify/flash-list';
import Svg, {Circle, Rect, Text as SvgText} from 'react-native-svg';
import {Body, Screen, Title} from '../probe';

const ROWS = ['FlashList row one', 'FlashList row two', 'FlashList row three'];

export default function Ports() {
  const [storage, setStorage] = useState('…');
  const [network, setNetwork] = useState('…');
  useEffect(() => {
    const value = `kept at ${new Date().toISOString()}`;
    AsyncStorage.setItem('probe', value)
      .then(() => AsyncStorage.getItem('probe'))
      .then(read => setStorage(read === value ? `round trip · ${read}` : `✕ read back ${read}`))
      .catch((error: Error) => setStorage(`✕ ${error.message}`));
    fetchNetwork()
      .then(state => setNetwork(`${state.type} · connected ${state.isConnected} · internet ${state.isInternetReachable}`))
      .catch((error: Error) => setNetwork(`✕ ${error.message}`));
  }, []);
  return (
    <Screen>
      <Title>Ports</Title>
      <Body testID="storage">{`AsyncStorage ${storage}`}</Body>
      <Body testID="network">{`NetInfo ${network}`}</Body>
      <View testID="svg" style={{height: 90}}>
        <Svg width={240} height={90}>
          <Rect x={4} y={4} width={232} height={82} rx={12} fill="#1c2027" stroke="#4ca0e8" strokeWidth={2}/>
          <Circle cx={48} cy={45} r={28} fill="#7ed3a5"/>
          <SvgText x={96} y={52} fill="#e8ebef" fontSize={20}>
            react-native-svg
          </SvgText>
        </Svg>
      </View>
      <View testID="list" style={{height: 120}}>
        <FlashList data={ROWS} renderItem={({item}) => <Body>{item}</Body>} keyExtractor={item => item}/>
      </View>
    </Screen>
  );
}
