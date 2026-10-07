import {router, useLocalSearchParams} from 'expo-router';
import {Sheet} from 'expo-interface';
import {getDrop} from '@/drop/data';
import {FileList} from '@/file/list';

export default function DropFilesScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const drop = getDrop(id);
  const count = drop?.files.length ?? 0;
  return (
    <Sheet
      isPresented
      title="Files"
      subtitle={`${count} ${count === 1 ? 'file' : 'files'}`}
      onClose={() => router.back()}
      onDismiss={() => router.back()}>
      <FileList items={drop?.files ?? []}/>
    </Sheet>
  );
}
