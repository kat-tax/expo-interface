import type {Href} from 'expo-router';
import {Platform} from 'react-native';
import {router} from 'expo-router';
import {Screen} from 'expo-interface';
import {DropList} from '@/drop/list';
import {demoDropData} from '@/drop/data';

export default function HomeScreen() {
  return (
    <Screen native header={Platform.OS !== 'web'}>
      <DropList
        items={demoDropData}
        // SDK 56 typed-routes mis-generates dynamic routes, so cast the
        // runtime-correct path `/<nanoid>` to Href.
        onSelect={drop => router.push(`/${drop.id}` as Href)}
      />
    </Screen>
  );
}
