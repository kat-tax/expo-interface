import type {Meta, StoryObj} from '@storybook/react-native';
import {StyleSheet, View} from 'react-native';
import {NativeHost} from '../host';
import {Badge} from '.';

const meta = {
  title: 'Indicators/Badge',
  component: Badge,
  parameters: {
    // A badge stands in a React Native layout of its own; `InAHost` shows one inside a host.
    native: false,
    docs: {
      description: {
        component:
          'A count or a dot beside the thing it is about. A WinUI `InfoBadge` on Windows; on Android the Material 3 `Badge` inside a native host, drawn to its geometry anywhere else; drawn on iOS, where SwiftUI only paints its own badge inside a `List`, a `TabView` or a toolbar. Placing one over a control is the caller\'s job.',
      },
    },
  },
  args: {
    count: 3,
  },
  argTypes: {
    color: {control: 'color'},
    textColor: {control: 'color'},
    count: {control: {type: 'number'}},
    max: {control: {type: 'number'}},
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Count: Story = {};

export const TwoDigits: Story = {args: {count: 42}};

/** Past `max` the badge stops growing, so it cannot shove a layout around. */
export const Overflowing: Story = {args: {count: 150, max: 99}};

/** Something changed here, where the number is not worth saying. */
export const Dot: Story = {args: {dot: true, label: 'Unsaved changes'}};

export const Colored: Story = {args: {count: 7, color: '#0A84FF'}};

/** Zero is not news, so nothing is drawn unless the caller asks for it. */
export const Zero: Story = {
  args: {count: 0},
  render: args => (
    <View style={styles.row}>
      <Badge {...args}/>
      <Badge {...args} showZero/>
    </View>
  ),
};

/** Inside a host, Android shows Compose's Material badge; anywhere else it is drawn to the same geometry. */
export const InAHost: Story = {
  render: args => (
    <NativeHost fit direction="row" spacing={12}>
      <Badge {...args}/>
      <Badge dot label="Unsaved changes"/>
    </NativeHost>
  ),
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
});
