import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Divider} from '../divider';
import {Footnote} from '../typography';
import {Menu} from '../menu';
import {TextField} from '../text-field';
import * as icons from '../__stories__/icons';
import {Toolbar} from '.';

const meta = {
  title: 'Layout/Toolbar',
  component: Toolbar,
  parameters: {native: false, docs: {description: {component: 'A bar of tools along a canvas. The controls are one native view — a `Row` inside a single host — so a bar of buttons and menus costs one bridge crossing, not one per group. A `field` splits it in two, since a text field is a React Native input.'}}},
  args: {
    placement: 'bottom',
  },
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        leading={
          <>
            <Button label="Bold" prefixIcon={icons.add} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
            <Divider vertical/>
            <Button label="Share" prefixIcon={icons.share} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
          </>
        }
        trailing={
          <Menu
            label="Export"
            icon={icons.chevron}
            variant="text"
            size="small"
            items={[{label: 'PDF'}, {label: 'Markdown'}]}
          />
        }
      />
    </View>
  ),
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tools: Story = {};

export const AtTheTop: Story = {
  args: {placement: 'top'},
};

export const WithAField: Story = {
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        leading={<Button label="Search" prefixIcon={icons.add} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>}
        field={<TextField placeholder="Search the document" variant="inline"/>}
        trailing={<Button label="Next" variant="text" size="inline" onPress={fn()}/>}
      />
    </View>
  ),
};

const styles = StyleSheet.create({
  stage: {gap: 24},
});
