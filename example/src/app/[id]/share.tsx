import {router, useLocalSearchParams} from 'expo-router';
import {DropShare} from '@/drop/share';
import {Sheet} from 'expo-interface';

export default function DropShareScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  return (
    <Sheet isPresented onDismiss={() => router.back()}>
      <DropShare id={id}/>
    </Sheet>
  );
}
