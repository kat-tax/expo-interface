import {useState} from 'react';
import {useRouter} from 'expo-router';
import {Body, Button, FieldGroup, Screen, Switch, TextField} from 'expo-interface';

export default function Edit() {
  const router = useRouter();
  const [name, setName] = useState('Drop 1');
  const [shared, setShared] = useState(true);
  return (
    <Screen>
      <Body>A modal route: a card over smoke, with islands inside it.</Body>
      <FieldGroup>
        <FieldGroup.Section title="Drop">
          <TextField label="Name" value={name} onChangeText={setName}/>
          <Switch label="Shared" value={shared} onValueChange={setShared}/>
        </FieldGroup.Section>
      </FieldGroup>
      <Button label="Done" onPress={() => router.back()}/>
    </Screen>
  );
}
