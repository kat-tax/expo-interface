import {router, useLocalSearchParams} from 'expo-router';
import {Sheet} from '@/core/sheet';
import {FileList} from '@/file/list';
import {getDrop} from '@/drop/data';

export default function DropFilesScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const drop = getDrop(id);
  return (
    <Sheet isPresented onDismiss={() => router.back()}>
      <FileList items={drop?.files ?? []}/>
    </Sheet>
  );
}
