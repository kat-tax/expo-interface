import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Caption, Footnote, Headline} from '../typography';
import {NativeHost} from '../host';
import {Menu} from '../menu';
import {IconToggle} from '../icon-toggle';
import {useColor} from '../theme';
import * as icons from '../__stories__/icons';
import {Card} from '.';

/** What a document card holds: a preview the app draws. */
function Preview({height = 96}: {height?: number}) {
  return (
    <View style={[styles.preview, {height}]}>
      <Footnote color="tertiaryLabel">Preview</Footnote>
    </View>
  );
}

/** A picture bleeding to the card's edges. */
function Picture() {
  const fill = useColor('backgroundSelected');
  return (
    <View style={[styles.picture, {backgroundColor: fill}]}>
      <Footnote color="tertiaryLabel">Picture</Footnote>
    </View>
  );
}

const meta = {
  title: 'Layout/Card',
  component: Card,
  parameters: {native: false, docs: {description: {component: 'A pressable `Surface` with a picture, a title, the platform\'s menu and a star: a document in a list, a space on a dashboard. The menu and the star are the kit\'s own controls, placed by the kit outside the card\'s press target; `overlay` and `badge` take anything else of the app\'s own.'}}},
  args: {
    padding: 12,
    gap: 8,
    disabled: false,
    title: 'Holiday photos',
    subtitle: 'Edited yesterday',
    onPress: fn(),
  },
  render: args => (
    <View style={styles.column}>
      <Card {...args}>
        <Preview/>
      </Card>
    </View>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The title and subtitle the kit draws as the footer, the body above them. */
export const Document: Story = {};

/**
 * The card's own actions, as the platform's menu behind an ellipsis level
 * with the title: a SwiftUI `Menu`, a Compose `DropdownMenu`, a popover on
 * web, a WinUI `MenuFlyout`.
 */
export const WithMenu: Story = {
  args: {
    menu: [{label: 'Rename'}, {label: 'Share'}, {label: 'Delete', role: 'destructive', separator: true}],
  },
};

/**
 * The star over the picture. While it is not set it is drawn under a
 * pointer that hovers (web, Windows) or the keyboard, and always where
 * nothing hovers; once set it stays.
 */
export const Favorite: Story = {
  render: function Render(args) {
    const [starred, setStarred] = useState(false);
    return (
      <View style={styles.column}>
        <Card {...args} favorite={{value: starred, onValueChange: setStarred}} menu={[{label: 'Rename'}, {label: 'Delete', role: 'destructive'}]}>
          <Preview/>
        </Card>
      </View>
    );
  },
};

/** A picture bleeding to the card's edges, clipped by its corners, the title padded under it. */
export const Media: Story = {
  render: args => (
    <View style={styles.column}>
      <Card {...args} media={<Picture/>} menu={[{label: 'Rename'}, {label: 'Delete', role: 'destructive'}]}/>
    </View>
  ),
};

/** A footer and an overlay of the app's own, in place of the title and the menu. */
export const WithOverlay: Story = {
  args: {title: undefined, subtitle: undefined},
  render: args => (
    <View style={styles.column}>
      <Card
        {...args}
        label="Holiday photos"
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
        <Preview/>
      </Card>
    </View>
  ),
};

export const WithABadge: Story = {
  parameters: {docs: {description: {story: 'The two floating slots at once with content of the app\'s own: a star over the picture in `badge`, the menu level with the footer in `overlay`. Both sit outside the card\'s press target, and both stay drawn, since a phone has no hover to reveal them with.'}}},
  args: {title: undefined, subtitle: undefined},
  render: args => (
    <View style={styles.column}>
      <Card
        {...args}
        label="Holiday photos"
        badge={<IconToggle label="Favourite" icon={icons.star} value onValueChange={fn()}/>}
        overlay={
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
        }
        footer={
          <View>
            <Headline color="label">Holiday photos</Headline>
            <Caption color="secondaryLabel">Edited yesterday</Caption>
          </View>
        }>
        <Preview/>
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
  preview: {alignItems: 'center', justifyContent: 'center'},
  picture: {height: 140, alignItems: 'center', justifyContent: 'center'},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 4},
});
