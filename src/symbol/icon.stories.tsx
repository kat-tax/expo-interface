import type {Meta, StoryObj} from '@storybook/react-native';
import {StyleSheet, View} from 'react-native';
import * as icons from '../__stories__/icons';
import {Icon} from '.';

const meta = {
  title: 'Indicators/Icon',
  component: Icon,
  parameters: {
    native: false,
    docs: {
      description: {
        component:
          'An icon on its own, from a token: an SF Symbol on iOS, a Material Symbol on Android and web, a Segoe Fluent glyph on Windows. `tone` names its color by role; a filled token draws the solid form where the platform has one.',
      },
    },
  },
  args: {
    icon: icons.share,
    size: 24,
    tone: 'label',
  },
  argTypes: {
    tone: {control: 'select', options: ['label', 'secondary', 'tertiary', 'accent', 'success', 'destructive']},
    tintColor: {control: 'color'},
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Label: Story = {};

export const Filled: Story = {
  args: {icon: icons.starFilled, tone: 'accent'},
};

/** Every tone, at the three sizes a control draws at. */
export const Tones: Story = {
  render: args => (
    <View style={styles.rows}>
      {(['label', 'secondary', 'tertiary', 'accent', 'success', 'destructive'] as const).map(tone => (
        <View key={tone} style={styles.row}>
          <Icon {...args} tone={tone} size={16}/>
          <Icon {...args} tone={tone} size={24}/>
          <Icon {...args} tone={tone} size={32}/>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  rows: {gap: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
});
