import {router, useLocalSearchParams} from 'expo-router';
import {BottomSheet} from '@expo/ui';
import {DropShare} from '@/drop/share';

export default function DropShareScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  return (
    <BottomSheet isPresented onDismiss={() => router.back()}>
      <DropShare id={id}/>
    </BottomSheet>
  );
}
