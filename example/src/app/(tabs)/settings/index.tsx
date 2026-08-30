import {Platform} from 'react-native';
import {Screen} from 'expo-interface';
import {ProfileSettings} from '@/profile/settings';

export default function SettingsScreen() {
  return (
    <Screen native header={Platform.OS !== 'web'}>
      <ProfileSettings/>
    </Screen>
  );
}
