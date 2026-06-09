import {router, useLocalSearchParams} from 'expo-router';
import {BottomSheet} from '@expo/ui';
import {FileList} from '@/file/list';
import {getDrop} from '@/drop/data';

export default function DropFilesScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const drop = getDrop(id);
  return (
    <BottomSheet isPresented onDismiss={() => router.back()}>
      <FileList items={drop?.files ?? []}/>
    </BottomSheet>
  );
}
