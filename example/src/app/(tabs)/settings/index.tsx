import {Screen} from 'expo-interface';
import {ProfileSettings} from '@/profile/settings';

export default function SettingsScreen() {
  // No `header`: the screen sits under `TabStack`'s header, on every platform.
  return (
    <Screen native>
      <ProfileSettings/>
    </Screen>
  );
}
