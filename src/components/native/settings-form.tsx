import {useState} from 'react';
import {FieldGroup, Text} from '@expo/ui';
import {getVal, variants} from '@/ui/theme';
import {DateTimePicker} from '@/ui/date-time';
import {Picker} from '@/ui/picker';
import {Switch} from '@/ui/switch';

const DROP_OPTIONS = [
  {label: 'Public', value: 'public'},
  {label: 'Private', value: 'private'},
];

export function SettingsForm() {
  const [dropPrivacy, setDropPrivacy] = useState('public');
  const [analytics, setAnalytics] = useState(false);
  const [datetime, setDatetime] = useState(() => new Date());
  return (
    <FieldGroup>
      <FieldGroup.Section title="Defaults">
        <Picker
          label="Drop Privacy"
          selectedValue={dropPrivacy}
          onValueChange={setDropPrivacy}>
          {DROP_OPTIONS.map(f => (
            <Picker.Item key={f.value} label={f.label} value={f.value} />
          ))}
        </Picker>
        <DateTimePicker
          label="Expiration"
          mode="datetime"
          value={datetime}
          onChange={setDatetime}
        />
        <Switch
          label="Notify on upload"
          value={analytics}
          onValueChange={setAnalytics}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="About">
        <Text>Version 1.0.0</Text>
        {/* <FieldGroup.SectionFooter>
          <Text textStyle={{
            fontSize: variants.footnote?.fontSize,
            color: getVal('secondaryLabel'),
          }}>
            You are on the latest version.
          </Text>
        </FieldGroup.SectionFooter> */}
      </FieldGroup.Section>
    </FieldGroup>
  );
}
