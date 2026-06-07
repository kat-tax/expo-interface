import {Host} from '@expo/ui';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, View} from 'react-native';
import {spacing, inset, boundaries} from '@/ui/theme';
import {SettingsForm} from '@/components/native/settings-form';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.viewport}>
        <Host style={{flex: 1}}>
          <SettingsForm/>
        </Host>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    gap: spacing.three,
    paddingHorizontal: spacing.four,
    paddingBottom: inset.bottomTab + spacing.three,
    paddingTop: inset.topBar,
  },
  viewport: {
    flex: 1,
    width: '100%',
    maxWidth: boundaries.contentMaxWidth,
  },
});
