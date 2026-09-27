/**
 * React Native content inside a windowed XAML popup: the dialog island's body
 * slot filled through the portal, with a kit Button nested in it. The ids are
 * what the Windows checks look for.
 */
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Body, Button, Screen, Title} from 'expo-interface';
import XamlContentDialog from 'expo-interface/src/windows/specs/ExpoInterfaceContentDialogNativeComponent';
import {Portal} from 'expo-interface/src/windows/portal';
import {useXamlProps} from 'expo-interface/src/windows';

export default function PopupProbe() {
  const [open, setOpen] = useState(false);
  const [plain, setPlain] = useState(false);
  const [inner, setInner] = useState(0);
  const look = useXamlProps();
  return (
    <Screen>
      <Title>Popup</Title>
      <Body testID="state">{`open ${open} · plain ${plain} · inner ${inner}`}</Body>
      <Button testID="open" label="Open dialog" onPress={() => setOpen(true)}/>
      <Button testID="open-plain" label="Open plain dialog" onPress={() => setPlain(true)}/>
      {plain ? (
        <XamlContentDialog
          open
          title="A plain dialog"
          message="No slot."
          actions={JSON.stringify([{label: 'Close', role: 'cancel'}])}
          onClose={() => setPlain(false)}
          style={styles.anchor}
          testID="plain-dialog"
          {...look}
        />
      ) : null}
      {open ? (
        <View>
          <XamlContentDialog
            open
            title="React inside a dialog"
            actions={JSON.stringify([{label: 'Close', role: 'cancel'}])}
            slot="dialog-body"
            onClose={() => setOpen(false)}
            style={styles.anchor}
            testID="dialog"
            {...look}
          />
          <Portal slot="dialog-body">
            <View style={{padding: 8, gap: 8, backgroundColor: '#FFF3E0'}}>
              <Text testID="dialog-text" style={{color: '#3E2723'}}>React content inside a XAML dialog.</Text>
              <Button testID="dialog-button" label={`Inner ${inner}`} onPress={() => setInner(count => count + 1)}/>
            </View>
          </Portal>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});
