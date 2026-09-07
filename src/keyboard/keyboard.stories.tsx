import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {NativeHost} from '../host';
import {TextField} from '../text-field';
import {Body, Footnote, Title} from '../typography';
import * as icons from '../__stories__/icons';
import {KeyboardBar} from '.';

/** A screen with a note above a bar that sticks to the keyboard. */
function Editor({onKeyboard}: {onKeyboard: (height: number) => void}) {
  const [note, setNote] = useState('');
  const [covered, setCovered] = useState(0);
  return (
    <View style={styles.screen}>
      <View style={[styles.content, {paddingBottom: covered}]}>
        <Title>Notes</Title>
        <Body color="secondaryLabel">
          Tap the field: natively the bar below rides up on the keyboard and the
          content is told how much of its bottom is covered.
        </Body>
        <TextField variant="inline" placeholder="Write a note…" value={note} onChangeText={setNote} multiline/>
        <Footnote color="tertiaryLabel">{covered ? `Keyboard: ${Math.round(covered)} pt` : 'Keyboard away'}</Footnote>
      </View>
      <KeyboardBar
        style={styles.bar}
        onKeyboard={height => {
          setCovered(height);
          onKeyboard(height);
        }}>
        <NativeHost fit>
          <Button label="Attach" prefixIcon={icons.add} hideLabel size="small" variant="text" tone="label" onPress={fn()}/>
        </NativeHost>
        <View style={styles.spacer}/>
        <NativeHost fit>
          <Button label="Send" prefixIcon={icons.share} size="small" onPress={fn()}/>
        </NativeHost>
      </KeyboardBar>
    </View>
  );
}

const meta = {
  title: 'Layout/KeyboardBar',
  component: KeyboardBar,
  // A React Native layout; the bar hosts its own controls.
  parameters: {docs: {description: {component: 'Bottom bar that sticks to the keyboard by a transform (never a resize) and reports the keyboard\'s height, through `react-native-keyboard-controller` when the app has it; a plain view on web.'}}, native: false},
  args: {
    onKeyboard: fn(),
  },
  render: args => <Editor onKeyboard={args.onKeyboard!}/>,
} satisfies Meta<typeof KeyboardBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const styles = StyleSheet.create({
  screen: {flex: 1, minHeight: 320},
  content: {flex: 1, gap: 8, padding: 16},
  bar: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 4},
  spacer: {flex: 1},
});
