/**
 * What the probe routes are drawn with: React Native's own views and nothing
 * else, so the app proves the runtime without a UI kit installed. A screen
 * that scrolls, a title, a line of text a test can find, and a button.
 */
import type {ReactNode} from 'react';
import {Pressable, ScrollView, StyleSheet, Text} from 'react-native';

export function Screen({children}: {children?: ReactNode}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

export function Title({children}: {children?: ReactNode}) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

export function Body({children, testID}: {children?: ReactNode; testID?: string}) {
  return <Text testID={testID} style={styles.body}>{children}</Text>;
}

export function Button({label, onPress}: {label: string; onPress(): void}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {padding: 24, gap: 12},
  title: {fontSize: 28, fontWeight: '600', color: '#1A1A1A'},
  body: {fontSize: 14, lineHeight: 20, color: '#1A1A1A'},
  button: {alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, backgroundColor: '#005FB8'},
  pressed: {opacity: 0.8},
  label: {fontSize: 14, color: '#FFFFFF'},
});
