import {useState} from 'react';
import {Footnote} from '@/ui/typography';
import {TextField} from '@/ui/text-field';
import {FieldGroup} from '@/ui/field-group';

export function ProfileSettings() {
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
        <Footnote>Version 1.0.0</Footnote>
      </FieldGroup.Section>
    </FieldGroup>
  );
}
