import {useLocalSearchParams, useNavigation} from 'expo-router';
import {useLayoutEffect} from 'react';
import {DropUpload} from '@/drop/upload';
import {getDrop} from '@/drop/data';
import {Screen} from '@/core/screen';

export default function DropUploadScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const nav = useNavigation();

  useLayoutEffect(() => {
    const drop = getDrop(id);
    nav.setOptions({title: drop?.name ?? 'New Drop'});
  }, [nav, id]);

  return (
    <Screen native header>
      <DropUpload id={id}/>
    </Screen>
  );
}
