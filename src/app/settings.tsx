import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FormDrop} from '@/components/native/form-drop';
import * as Theme from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.viewport}>
        <FormDrop id="drop-1"/>
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
