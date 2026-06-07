import {Host} from '@expo/ui';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, View} from 'react-native';
import {spacing, inset, bound} from '@/ui/theme';
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
    width: '100%',
    gap: spacing.three,
    alignItems: 'center',
    paddingTop: inset.topBar,
    paddingBottom: inset.bottomTab + spacing.three,
    paddingHorizontal: spacing.four,
  },
  viewport: {
    flex: 1,
    width: '100%',
    maxWidth: bound.contentMaxWidth,
  },
});
