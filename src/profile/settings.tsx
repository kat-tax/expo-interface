import {useState} from 'react';
import {FieldGroup, Text} from '@expo/ui';
import {TextField} from '@/ui/text-field';
import {Caption} from '@/ui/typography';
import {useColor} from '@/ui/theme';

export function ProfileSettings() {
  const label = useColor('label');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <FieldGroup>
      <FieldGroup.Section title="User">
        <TextField
          value={name}
          placeholder="Name"
          onChangeText={setName}
        />
        <TextField
          value={email}
          placeholder="Email"
          keyboardType="email"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setEmail}
        />
        <TextField
          value={phone}
          placeholder="Phone"
          keyboardType="phone"
          onChangeText={setPhone}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="About">
        <Text textStyle={{color: label}}>Version 1.0.0</Text>
        <FieldGroup.SectionFooter>
          <Caption>You are on the latest version.</Caption>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>
    </FieldGroup>
  );
}
