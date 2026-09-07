import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {NativeHost} from '../host';
import {Toast} from '.';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {native: false, docs: {description: {component: 'A brief message over the screen. Android shows the Material 3 `Snackbar`; iOS and web have no such control, so the kit draws the capsule Apple\'s own apps draw, announced as a live region.'}}},
  args: {
    message: '3 files added',
    visible: true,
    duration: 4000,
    onDismiss: fn(),
  },
  render: args => (
    <View style={styles.stage}>
      <Toast {...args}/>
    </View>
  ),
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Message: Story = {};

export const WithAction: Story = {
  args: {message: 'Note deleted', action: {label: 'Undo', onPress: fn()}},
};

export const Interactive: Story = {
  render: function Interactive(args) {
    const [visible, setVisible] = useState(false);
    return (
      <View style={styles.stage}>
        <NativeHost fit>
          <Button label="Show the toast" onPress={() => setVisible(true)}/>
        </NativeHost>
        <Toast {...args} visible={visible} onDismiss={() => setVisible(false)}/>
      </View>
    );
  },
};

const styles = StyleSheet.create({
  stage: {height: 160, justifyContent: 'flex-start'},
});
