import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Caption, Footnote, Headline} from '../typography';
import {NativeHost} from '../host';
import {Menu} from '../menu';
import {IconToggle} from '../icon-toggle';
import * as icons from '../__stories__/icons';
import {Card} from '.';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {native: false, docs: {description: {component: 'A pressable `Surface` with header, body, footer and overlay slots: a document in a list, a space on a dashboard. Actions go in `overlay`, outside the card\'s own press target.'}}},
  args: {
    padding: 12,
    gap: 8,
    disabled: false,
    label: 'Holiday photos',
    onPress: fn(),
  },
  render: args => (
    <View style={styles.column}>
      <Card
        {...args}
        footer={
          <View>
            <Headline color="label">Holiday photos</Headline>
            <Caption color="secondaryLabel">Edited yesterday</Caption>
          </View>
        }>
        <View style={styles.preview}>
          <Footnote color="tertiaryLabel">Preview</Footnote>
        </View>
      </Card>
    </View>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = {};

export const WithOverlay: Story = {
  render: args => (
    <View style={styles.column}>
      <Card
        {...args}
        overlay={
          <View style={styles.actions}>
            <IconToggle label="Favourite" icon={icons.star} value onValueChange={fn()}/>
            <NativeHost fit>
              <Menu
                label="More"
                icon={icons.settings}
                hideLabel
                variant="text"
                size="small"
                items={[{label: 'Rename'}, {label: 'Delete', role: 'destructive'}]}
              />
            </NativeHost>
          </View>
        }
        footer={<Headline color="label">Holiday photos</Headline>}>
        <View style={styles.preview}>
          <Footnote color="tertiaryLabel">Preview</Footnote>
        </View>
      </Card>
    </View>
  ),
};

export const Disabled: Story = {
  args: {disabled: true},
};

const styles = StyleSheet.create({
  // A card fills the column it is given; a document card's is about this wide.
  column: {maxWidth: 320},
  preview: {height: 96, alignItems: 'center', justifyContent: 'center'},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 4},
});
