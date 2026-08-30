import {useState} from 'react';
import {Checkbox, DateTimePicker, FieldGroup, Picker, SegmentedControl, Slider, Stepper, Switch} from 'expo-interface';

export const DROP_OPTIONS = [
  {label: 'Public', value: 'public'},
  {label: 'Private', value: 'private'},
];

export function DropSettings() {
  const [privacy, setPrivacy] = useState('public');
  const [datetime, setDatetime] = useState(() => new Date());
  const [analytics, setAnalytics] = useState(false);
  const [layout, setLayout] = useState('list');
  const [maxFiles, setMaxFiles] = useState(10);
  const [quality, setQuality] = useState(0.8);
  const [password, setPassword] = useState(false);
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
        <Checkbox
          label="Require password"
          value={password}
          onValueChange={setPassword}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="Limits">
        <SegmentedControl label="Layout" selectedValue={layout} onValueChange={setLayout}>
          <SegmentedControl.Item label="List" value="list"/>
          <SegmentedControl.Item label="Grid" value="grid"/>
        </SegmentedControl>
        <Stepper
          label="Max files"
          value={maxFiles}
          min={1}
          max={50}
          onValueChange={setMaxFiles}
        />
        <Slider
          label="Image quality"
          value={quality}
          min={0.1}
          max={1}
          step={0.1}
          onValueChange={setQuality}
        />
      </FieldGroup.Section>
    </FieldGroup>
  );
}
