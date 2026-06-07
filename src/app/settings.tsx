import {Host} from '@expo/ui';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, View} from 'react-native';
import {SettingsForm} from '@/components/native/settings-form';
import * as Theme from '@/ui/theme';

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
    gap: Theme.Spacing.three,
    paddingHorizontal: Theme.Spacing.four,
    paddingBottom: Theme.BottomTabInset + Theme.Spacing.three,
    paddingTop: Theme.TopBarInset,
  },
  viewport: {
    flex: 1,
    width: '100%',
    maxWidth: Theme.BoxMaxWidth,
  },
});
