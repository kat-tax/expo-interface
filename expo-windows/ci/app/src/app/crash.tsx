/**
 * The runtime's crash reports: what the app left behind the last time it
 * died, read at launch; and, asked through the link's `do` parameter, a
 * fatal JavaScript error (`?do=javascript`) or a native access violation
 * (`?do=native`) thrown on purpose so the next launch has one to show —
 * the route the Windows CI app and the harness carry to prove them.
 */
import {useEffect, useState} from 'react';
import {TurboModuleRegistry} from 'react-native';
import {requireNativeModule} from 'expo-modules-core';
import {useLocalSearchParams} from 'expo-router';
import {Body, Screen, Title} from '../probe';

type CrashReport = {type: string; timestamp: string; message: string; stack?: string; dump?: string};
const ExpoWindows = requireNativeModule<{getLastCrashAsync(): Promise<CrashReport | null>}>('ExpoWindows');

export default function CrashRoute() {
  const {do: action} = useLocalSearchParams<{do?: string}>();
  const [last, setLast] = useState('reading…');
  useEffect(() => {
    ExpoWindows.getLastCrashAsync()
      .then(report => setLast(report ? `${report.type} at ${report.timestamp}: ${report.message}${report.dump ? ` · dump ${report.dump.slice(-24)}` : ''}${report.stack ? ` · stack ${report.stack.split('\n')[0]?.slice(0, 60)}` : ''}` : 'none'))
      .catch((error: Error) => setLast(`✕ ${error.message}`));
    if (action === 'javascript') {
      setTimeout(() => {
        throw new Error('A fatal error thrown on purpose by the crash probe');
      }, 500);
    } else if (action === 'native') {
      setTimeout(() => (TurboModuleRegistry.get('ExpoWindowsCrashes') as {crash(): void} | null)?.crash(), 500);
    }
  }, [action]);
  return (
    <Screen>
      <Title>Crash</Title>
      <Body testID="last">{`Last crash: ${last}`}</Body>
      <Body testID="action">{action ? `About to die: ${action}` : 'Open with ?do=javascript or ?do=native to leave a report'}</Body>
    </Screen>
  );
}
