import {FormDrop} from '@/components/native/form-drop';
import {BottomTabInset, BoxMaxWidth, Spacing, TopBarInset} from '@/constants/theme';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.viewport}>
        <FormDrop id="drop-1"/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    paddingTop: TopBarInset,
    width: '100%',
  },
  viewport: {
    flex: 1,
    width: '100%',
    maxWidth: BoxMaxWidth,
  },
});
