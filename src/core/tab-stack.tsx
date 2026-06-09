import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {useNavTheme} from '@/ui/theme';

export function TabStack({title}: {title: string}) {
  const {colors} = useNavTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS !== 'web',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.text,
        headerTitleStyle: {color: colors.text},
        headerStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen name="index" options={{title}}/>
    </Stack>
  );
}
