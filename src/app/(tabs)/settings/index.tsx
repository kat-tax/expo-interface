import {Platform} from 'react-native';
import {Screen} from '@/core/screen';
import {ProfileSettings} from '@/profile/settings';

export default function SettingsScreen() {
  return (
    <Screen native header={Platform.OS !== 'web'}>
      <ProfileSettings/>
    </Screen>
  );
}
