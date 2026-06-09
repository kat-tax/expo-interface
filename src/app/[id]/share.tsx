import {router, useLocalSearchParams} from 'expo-router';
import {Sheet} from '@/core/sheet';
import {DropShare} from '@/drop/share';

export default function DropShareScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  return (
    <Sheet isPresented onDismiss={() => router.back()}>
      <DropShare id={id}/>
    </Sheet>
  );
}
