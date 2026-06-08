import {useEffect} from 'react';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useColorScheme, StyleSheet, View} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {bound, inset, spacing} from '@/ui/theme';

export function Screen({children}: React.PropsWithChildren) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const backgroundColor = isDark ? 'black' : 'white';

  useEffect(() => {
    setBackgroundColorAsync(backgroundColor);
  }, [isDark]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor}}>
      <StatusBar style={isDark ? 'light' : 'dark'}/>
      <View style={styles.root}>
        <View style={styles.inner}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.four,
    paddingBottom: inset.bottomTab + spacing.three,
    paddingTop: inset.topBar,
    gap: spacing.three,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: bound.contentMaxWidth,
  },
});
