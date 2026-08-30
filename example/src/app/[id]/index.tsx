import {useLocalSearchParams} from 'expo-router';
import {DropUpload} from '@/drop/upload';
import {Screen} from 'expo-interface';

export default function DropUploadScreen() {
  const {id} = useLocalSearchParams<{id: string}>();

  return (
    <Screen native header gutter>
      <DropUpload id={id}/>
    </Screen>
  );
}
