import {router} from 'expo-router';
import {BottomSheet} from '@expo/ui';
import {DropSettings} from '@/drop/settings';

export default function DropEditScreen() {
  return (
    <BottomSheet isPresented onDismiss={() => router.back()}>
      <DropSettings/>
    </BottomSheet>
  );
}
