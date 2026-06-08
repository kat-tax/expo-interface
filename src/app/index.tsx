import {Screen} from '@/core/screen';
import {FileList} from '@/file/list';

export default function HomeScreen() {
  return (
    <Screen native>
      <FileList items={[
        {id: 1, name: 'wedding.mp4', size: '1.3 GB', type: 'video' as const},
        {id: 2, name: 'kryptonite.mp3', size: '12 MB', type: 'audio' as const},
        {id: 3, name: 'code.tsx', size: '3 KB', type: 'text' as const},
        {id: 4, name: 'deer.jpg', size: '100 KB', type: 'image' as const},
        {id: 5, name: 'cursor.exe', size: '1 KB', type: 'other' as const},
      ]}/>
    </Screen>
  );
}
