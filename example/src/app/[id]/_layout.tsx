import {Stack} from 'expo-router';
import {Platform} from 'react-native';
import {ConstrainedStackHeader, useNavTheme} from 'expo-interface';

const sheet = {
  headerShown: false,
  presentation: 'transparentModal',
  animation: 'none',
} as const;

export default function DropLayout() {
  const {colors} = useNavTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        ...Platform.select({
          web: {header: ConstrainedStackHeader},
          default: {
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: colors.text,
            headerTitleStyle: {color: colors.text},
            headerStyle: {
              backgroundColor: colors.background,
            },
          },
        }),
      }}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="edit" options={sheet}/>
      <Stack.Screen name="share" options={sheet}/>
      <Stack.Screen name="files" options={sheet}/>
    </Stack>
  );
}
