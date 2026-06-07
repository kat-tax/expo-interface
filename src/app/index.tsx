import {Host} from '@expo/ui';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, View} from 'react-native';
import {spacing, inset, bound, theme} from '@/ui/theme';
import {FileList} from '@/components/native/file-list';

const DEMO_FILES = [
  {id: 1, name: 'wedding.mp4', size: '1.3 GB', type: 'video' as const},
  {id: 2, name: 'kryptonite.mp3', size: '12 MB', type: 'audio' as const},
  {id: 3, name: 'code.tsx', size: '3 KB', type: 'text' as const},
  {id: 4, name: 'deer.jpg', size: '100 KB', type: 'image' as const},
  {id: 5, name: 'cursor.exe', size: '1 KB', type: 'other' as const},
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.viewport}>
        <Host style={{flex: 1}}>
          <FileList items={DEMO_FILES}/>
        </Host>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: spacing.four,
    paddingBottom: inset.bottomTab + spacing.three,
    paddingTop: inset.topBar,
    gap: spacing.three,
  },
  viewport: {
    flex: 1,
    width: '100%',
    maxWidth: bound.contentMaxWidth,
  },
});
