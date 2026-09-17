import {useState} from 'react';
import {Checkbox, FieldGroup, Picker, Screen, SegmentedControl, Slider, Stepper, Switch, TextField} from 'expo-interface';

export default function Settings() {
  const [privacy, setPrivacy] = useState('public');
  const [notify, setNotify] = useState(false);
  const [password, setPassword] = useState(false);
  const [layout, setLayout] = useState('list');
  const [maxFiles, setMaxFiles] = useState(10);
  const [quality, setQuality] = useState(0.8);
  const [name, setName] = useState('');
  return (
    <Screen>
      <FieldGroup>
        <FieldGroup.Section title="Defaults">
          <Picker label="Privacy" selectedValue={privacy} onValueChange={setPrivacy}>
            <Picker.Item label="Public" value="public"/>
            <Picker.Item label="Private" value="private"/>
          </Picker>
          <Switch label="Notify on upload" value={notify} onValueChange={setNotify}/>
          <Checkbox label="Require password" value={password} onValueChange={setPassword}/>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Drop name"/>
        </FieldGroup.Section>
        <FieldGroup.Section title="Limits">
          <SegmentedControl label="Layout" selectedValue={layout} onValueChange={setLayout}>
            <SegmentedControl.Item label="List" value="list"/>
            <SegmentedControl.Item label="Grid" value="grid"/>
          </SegmentedControl>
          <Stepper label="Max files" value={maxFiles} min={1} max={50} onValueChange={setMaxFiles}/>
          <Slider label="Image quality" value={quality} min={0.1} max={1} step={0.1} onValueChange={setQuality}/>
        </FieldGroup.Section>
      </FieldGroup>
    </Screen>
  );
}
