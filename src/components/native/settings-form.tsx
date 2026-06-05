import {useState} from 'react';
import {FieldGroup, Switch, Text} from '@expo/ui';
import {DateTimePicker} from '@/components/ui/date-time';
import {usePalette} from '@/theme';

export function SettingsForm() {
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [datetime, setDatetime] = useState(() => new Date());
  const palette = usePalette();
  return (
    <FieldGroup>
      <FieldGroup.Section title="Notifications">
        <Switch
          label="Push"
          value={notifications}
          onValueChange={setNotifications}
        />
        <Switch
          label="Email"
          value={analytics}
          onValueChange={setAnalytics}
        />
        <DateTimePicker
          label="Expiration"
          mode="datetime"
          value={datetime}
          onChange={setDatetime}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="About">
        <Text>Version 1.0.0</Text>
        <FieldGroup.SectionFooter>
          <Text textStyle={{fontSize: 12, color: palette.textSecondary}}>
            You are on the latest version.
          </Text>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>
    </FieldGroup>
  );
}
