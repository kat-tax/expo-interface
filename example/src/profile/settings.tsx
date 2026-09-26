import {useState} from 'react';
import {Platform} from 'react-native';
import {Alert, Button, Collapsible, Footnote, Menu, SegmentedControl, TextField, FieldGroup} from 'expo-interface';
import * as icon from '@/icons';
import {PANES, setPane, usePane} from '@/profile/pane';

/**
 * Windows only: which of the WinUI `NavigationView`'s pane display modes the
 * app's tabs draw, changed live. Every mode is here, so the frame itself is
 * the demonstration of each one.
 */
function PaneSettings() {
  const pane = usePane();
  const current = PANES.find(entry => entry.value === pane) ?? PANES[0];
  return (
    <FieldGroup.Section title="Navigation">
      <SegmentedControl testID="pane-mode" label="Pane" selectedValue={pane} onValueChange={setPane}>
        {PANES.map(entry => (
          <SegmentedControl.Item key={entry.value} label={entry.label} value={entry.value}/>
        ))}
      </SegmentedControl>
      <Footnote color="secondaryLabel">{current.note}</Footnote>
    </FieldGroup.Section>
  );
}

export function ProfileSettings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <FieldGroup>
      {Platform.OS === 'windows' ? <PaneSettings/> : null}
      <FieldGroup.Section title="User">
        <TextField
          testID="profile-name"
          value={name}
          placeholder="Name"
          onChangeText={setName}
        />
        <TextField
          testID="profile-email"
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
            testID="delete-account"
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
