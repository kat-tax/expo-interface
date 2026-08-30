import {useState} from 'react';
import {FieldGroup} from '@/ui/field-group';
import {DateTimePicker} from '@/ui/date-time';
import {Picker} from '@/ui/picker';
import {Switch} from '@/ui/switch';

export const DROP_OPTIONS = [
  {label: 'Public', value: 'public'},
  {label: 'Private', value: 'private'},
];

export function DropSettings() {
  const [privacy, setPrivacy] = useState('public');
  const [datetime, setDatetime] = useState(() => new Date());
  const [analytics, setAnalytics] = useState(false);
  return (
    <FieldGroup>
      <FieldGroup.Section title="Defaults">
        <Picker
          label="Privacy"
          selectedValue={privacy}
          onValueChange={setPrivacy}>
          {DROP_OPTIONS.map(f => (
            <Picker.Item key={f.value} label={f.label} value={f.value}/>
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
    </FieldGroup>
  );
}
