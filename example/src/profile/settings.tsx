import {useState} from 'react';
import {Alert, Button, Collapsible, Footnote, Menu, TextField, FieldGroup} from 'expo-interface';
import * as icon from '@/icons';

export function ProfileSettings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      <FieldGroup.Section title="Account">
        <Menu
          label="Export"
          variant="outlined"
          icon={icon.share}
          items={[
            {label: 'Export drops', icon: icon.drop, onPress: () => {}},
            {label: 'Export files', icon: icon.fileOther, onPress: () => {}},
            {label: 'Clear cache', role: 'destructive', separator: true, onPress: () => {}},
          ]}
        />
        <Alert
          title="Delete account?"
          message="This removes every drop and file. It cannot be undone."
          visible={confirmDelete}
          onDismiss={() => setConfirmDelete(false)}
          actions={[
            {label: 'Cancel', role: 'cancel'},
            {label: 'Delete', role: 'destructive', onPress: () => {}},
          ]}>
          <Button
            label="Delete account"
            variant="text"
            role="destructive"
            prefixIcon={icon.trash}
            onPress={() => setConfirmDelete(true)}
          />
        </Alert>
      </FieldGroup.Section>
      <FieldGroup.Section title="About">
        <Collapsible label="Version 1.0.0">
          <Footnote color="secondaryLabel">Built with expo-interface on @expo/ui.</Footnote>
        </Collapsible>
      </FieldGroup.Section>
    </FieldGroup>
  );
}
