import {router} from 'expo-router';
import {Sheet} from '@/core/sheet';
import {DropSettings} from '@/drop/settings';

export default function DropEditScreen() {
  return (
    <Sheet isPresented onDismiss={() => router.back()}>
      <DropSettings/>
    </Sheet>
  );
}
