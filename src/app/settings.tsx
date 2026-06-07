import {Host} from '@expo/ui';
import {Screen} from '@/components/core/screen';
import {SettingsForm} from '@/components/native/settings-form';

export default function SettingsScreen() {
  return (
    <Screen>
      <Host style={{flex: 1}}>
        <SettingsForm/>
      </Host>
    </Screen>
  );
}

