import {useRouter} from 'expo-router';
import {Body, Button, Collapsible, Screen, Stack, Title} from 'expo-interface';

export default function Detail() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{title: 'Detail'}}/>
      <Screen>
        <Title>A pushed screen</Title>
        <Body>The header above is the kit’s drawn Windows stack header, with a back button.</Body>
        <Collapsible label="More">
          <Body>Disclosure content.</Body>
        </Collapsible>
        <Button label="Back" variant="outlined" onPress={() => router.back()}/>
      </Screen>
    </>
  );
}
