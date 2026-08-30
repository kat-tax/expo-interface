import {router, useLocalSearchParams} from 'expo-router';
import {DropShare} from '@/drop/share';
import {Sheet} from '@/core/sheet';

export default function DropShareScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  return (
    <Sheet isPresented onDismiss={() => router.back()}>
      <DropShare id={id}/>
    </Sheet>
  );
}
