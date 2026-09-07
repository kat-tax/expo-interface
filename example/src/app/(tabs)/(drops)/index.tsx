import type {Href} from 'expo-router';
import {Platform} from 'react-native';
import {router} from 'expo-router';
import {Fab, Screen} from 'expo-interface';
import {DropList} from '@/drop/list';
import {demoDropData} from '@/drop/data';
import * as icons from '@/icons';

export default function HomeScreen() {
  const [first] = demoDropData;
  return (
    <Screen
      native
      header={Platform.OS !== 'web'}
      // The screen floats the button over the list: bottom trailing, above the safe-area inset.
      fab={<Fab label="New drop" icon={icons.upload} onPress={() => router.push(`/${first.id}` as Href)}/>}>
      <DropList
        items={demoDropData}
        // SDK 56 typed-routes mis-generates dynamic routes, so cast the
        // runtime-correct path `/<nanoid>` to Href.
        onSelect={drop => router.push(`/${drop.id}` as Href)}
      />
    </Screen>
  );
}
