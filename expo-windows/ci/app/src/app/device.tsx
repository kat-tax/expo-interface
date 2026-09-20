/**
 * The device packages over the runtime's C++ modules — the battery,
 * keep-awake, screen capture and Windows Hello — each asked what it can do,
 * with a button where the answer needs the user: the route the Windows CI
 * app and the harness carry to prove them on screen.
 */
import {useEffect, useState} from 'react';
import {Body, Button, Screen, Title} from '../probe';
import * as Battery from 'expo-battery';
import * as KeepAwake from 'expo-keep-awake';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';

const STATES = ['unknown', 'unplugged', 'charging', 'full', 'not charging'];
const LEVELS = ['none', 'secret', 'biometric weak', 'biometric strong'];

export default function DeviceRoute() {
  const [battery, setBattery] = useState('…');
  const [awake, setAwake] = useState(false);
  const [keepAwake, setKeepAwake] = useState('…');
  const [capture, setCapture] = useState('…');
  const [hidden, setHidden] = useState(false);
  const [hello, setHello] = useState('…');
  const [verdict, setVerdict] = useState('not asked');

  useEffect(() => {
    Battery.isAvailableAsync()
      .then(async available => {
        const state = await Battery.getPowerStateAsync();
        setBattery(`${available ? 'battery' : 'no battery'} · level ${state.batteryLevel} · ${STATES[state.batteryState] ?? state.batteryState} · low power ${state.lowPowerMode}`);
      })
      .catch(error => setBattery(`✕ ${String(error)}`));
    KeepAwake.isAvailableAsync()
      .then(available => setKeepAwake(available ? 'available' : 'unavailable'))
      .catch(error => setKeepAwake(`✕ ${String(error)}`));
    ScreenCapture.isAvailableAsync()
      .then(async available => {
        const permission = await ScreenCapture.getPermissionsAsync();
        setCapture(`${available ? 'available' : 'unavailable'} · screenshot detection ${permission.status}`);
      })
      .catch(error => setCapture(`✕ ${String(error)}`));
    Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ])
      .then(([hardware, enrolled, types, level]) => setHello(`hardware ${hardware} · enrolled ${enrolled} · types ${types.join(',') || 'none'} · level ${LEVELS[level] ?? level}`))
      .catch(error => setHello(`✕ ${String(error)}`));
    const subscription = Battery.addBatteryLevelListener(({batteryLevel}) => setBattery(current => `${current} · now ${batteryLevel}`));
    return () => subscription.remove();
  }, []);

  const toggleAwake = () => {
    const next = !awake;
    setAwake(next);
    (next ? KeepAwake.activateKeepAwakeAsync('probe') : KeepAwake.deactivateKeepAwake('probe')).catch(error => setKeepAwake(`✕ ${String(error)}`));
  };

  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    (next ? ScreenCapture.preventScreenCaptureAsync('probe') : ScreenCapture.allowScreenCaptureAsync('probe')).catch(error => setCapture(`✕ ${String(error)}`));
  };

  const authenticate = () => {
    setVerdict('asking…');
    LocalAuthentication.authenticateAsync({promptMessage: 'The probe asks who you are'})
      .then(result => setVerdict(result.success ? 'verified' : `${result.error}${'warning' in result && result.warning ? ` (${result.warning})` : ''}`))
      .catch(error => setVerdict(`✕ ${String(error)}`));
  };

  return (
    <Screen>
      <Title>Device</Title>
      <Body testID="battery">{`Battery ${battery}`}</Body>
      <Body testID="keepAwake">{`Keep awake ${keepAwake} · ${awake ? 'kept awake' : 'free to sleep'}`}</Body>
      <Button label={awake ? 'Let it sleep' : 'Keep awake'} onPress={toggleAwake} />
      <Body testID="capture">{`Screen capture ${capture} · ${hidden ? 'hidden from captures' : 'visible to captures'}`}</Body>
      <Button label={hidden ? 'Show in captures' : 'Hide from captures'} onPress={toggleHidden} />
      <Body testID="hello">{`Windows Hello ${hello} · ${verdict}`}</Body>
      <Button label="Ask Windows Hello" onPress={authenticate} />
    </Screen>
  );
}
