import {useEffect, useState} from 'react';
import {Link, useRouter} from 'expo-router';
import {Text, useWindowDimensions} from 'react-native';
import Constants from 'expo-constants';
import {requireOptionalNativeModule} from 'expo-modules-core';
import * as Clipboard from 'expo-clipboard';
import * as Device from 'expo-device';
import {useFonts} from 'expo-font';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import {Body, Button, Card, ExternalLink, FieldGroup, KeyboardBar, ListItem, Menu, Screen, Sheet, Switch, Title, useHighContrast, useKeyboardShortcut} from 'expo-interface';

export default function Home() {
  const router = useRouter();
  const window = useWindowDimensions();
  const url = Linking.useURL();
  const contrast = useHighContrast();
  const [keyboardHeight, setKeyboardHeight] = useState(-1);
  const [keyboardSaid, setKeyboardSaid] = useState('');
  const keyboard = (show: boolean) => {
    const windows = requireOptionalNativeModule<{showTouchKeyboardAsync(): Promise<boolean>; hideTouchKeyboardAsync(): Promise<boolean>}>('ExpoWindows');
    (show ? windows?.showTouchKeyboardAsync() : windows?.hideTouchKeyboardAsync())?.then(took => setKeyboardSaid(`${show ? 'show' : 'hide'} ${took}`), (error: Error) => setKeyboardSaid(error.message));
  };
  // The family name inside the file, which is the name react-native-windows draws it under.
  const [fontsLoaded, fontError] = useFonts({
    'Material Symbols': require('@expo-google-fonts/material-symbols/400Regular/MaterialSymbols_400Regular.ttf'),
  });
  const [on, setOn] = useState(true);
  const [pressed, setPressed] = useState('none');
  useKeyboardShortcut('Ctrl+K', () => setPressed('Ctrl+K'));
  const [sheet, setSheet] = useState(false);
  const [inSheet, setInSheet] = useState(false);
  const [pasted, setPasted] = useState('');
  const [changes, setChanges] = useState(0);
  const [shared, setShared] = useState('');
  useEffect(() => {
    const subscription = Clipboard.addClipboardListener(event => {
      setChanges(count => count + 1);
      setPasted(`changed: ${event.contentTypes.join(',')}`);
    });
    return () => subscription.remove();
  }, []);
  const memory = Device.totalMemory ? `${Math.round(Device.totalMemory / 1024 ** 3)} GB` : '?';
  return (
    <Screen>
      <Title>Harness · {Constants.expoConfig?.name ?? 'no config'}</Title>
      <Body>scheme {Linking.createURL('/')} · last: {pressed} · window {Math.round(window.width)}×{Math.round(window.height)} @{window.scale}</Body>
      <Body>contrast: {String(contrast.enabled)} {contrast.scheme || '(none)'} {contrast.colors ? Object.values(contrast.colors).join(' ') : '-'}</Body>
      <Body>keyboard: {keyboardHeight} · {keyboardSaid}</Body>
      <KeyboardBar onKeyboard={setKeyboardHeight} style={{flexDirection: 'row', gap: 8, padding: 8}}>
        <Button label="Show keyboard" onPress={() => keyboard(true)}/>
        <Button label="Hide keyboard" onPress={() => keyboard(false)}/>
      </KeyboardBar>
      <Body>device: {Device.manufacturer ?? '?'} {Device.modelName ?? '?'} · {Device.osName} {Device.osVersion} ({Device.osBuildId ?? '?'}) · {memory} · {Device.supportedCpuArchitectures?.join(',') ?? '?'} · {Device.deviceName ?? '?'}</Body>
      <Body>link: {url ?? 'none'} · clipboard: {pasted || 'nothing yet'} · changes {changes} · share: {shared || '-'}</Body>
      <Body>
        font: {fontsLoaded ? 'loaded' : fontError ? `error ${fontError.message}` : 'loading'} ·{' '}
        <Text style={{fontFamily: 'Material Symbols', fontSize: 22}}>home settings</Text>
      </Body>
      <Menu
        label="File"
        items={[
          {label: 'Save', shortcut: 'Ctrl+S', onPress: () => setPressed('saved')},
          {label: 'New', shortcut: 'Ctrl+N', disabled: true, onPress: () => setPressed('new')},
        ]}
      />
      <FieldGroup>
        <FieldGroup.Section title="Kit controls">
          <Switch label="A switch" value={on} onValueChange={setOn}/>
          <ListItem supporting="A drawn row with hover" onPress={() => setPressed('row')}>
            Pressable row
          </ListItem>
          <ListItem action={{label: 'Go', onPress: () => router.push('/detail')}}>Push a screen</ListItem>
        </FieldGroup.Section>
        <FieldGroup.Section title="Runtime modules">
          <ListItem supporting="expo-clipboard setStringAsync" onPress={() => void Clipboard.setStringAsync(`Copied from WinKit at ${new Date().toLocaleTimeString()}`)}>Copy text</ListItem>
          <ListItem supporting="expo-clipboard getStringAsync" onPress={() => void Clipboard.getStringAsync().then(setPasted)}>Paste text</ListItem>
          <ListItem supporting="expo-sharing shareAsync" onPress={() => void Sharing.shareAsync('file:///W:/WinKit/app.json', {dialogTitle: 'Share app.json'}).then(() => setShared('opened'), error => setShared(`error ${error.message}`))}>Share app.json</ListItem>
        </FieldGroup.Section>
        <FieldGroup.Section title="Router">
          <ListItem supporting="a tab, in the NavigationView pane" onPress={() => router.push('/settings')}>Settings</ListItem>
          <ListItem supporting="presentation: modal" onPress={() => router.push('/edit')}>Edit (a modal route)</ListItem>
          <ListItem supporting="the kit's Sheet, a layer" onPress={() => setSheet(true)}>Show a sheet</ListItem>
          <ListItem supporting="expo-router Link">
            <Link href="/detail">Link to detail</Link>
          </ListItem>
          <ListItem supporting="ExternalLink through Linking">
            <ExternalLink href="https://expo.dev">expo.dev</ExternalLink>
          </ListItem>
        </FieldGroup.Section>
      </FieldGroup>
      <Card onPress={() => setPressed('card')} label="A card">
        <Body>A pressable card</Body>
      </Card>
      <Button label="Filled button" onPress={() => setPressed('button')}/>
      <Sheet isPresented={sheet} onDismiss={() => setSheet(false)}>
        <Title>A sheet</Title>
        <Body>Drawn as a layer over the window, with an island inside.</Body>
        <Switch label="In the sheet" value={inSheet} onValueChange={setInSheet}/>
        <Button label="Close" onPress={() => setSheet(false)}/>
      </Sheet>
    </Screen>
  );
}
