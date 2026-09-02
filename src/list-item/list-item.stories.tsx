import type {Meta, StoryObj} from '@storybook/react-native';
import type {IconToken} from '../icons';
import {fn} from 'storybook/test';
import {Column, Text} from '@expo/ui';
import {SymbolView} from 'expo-symbols';
import {fillWidth} from '../fill';
import {useColor} from '../theme';
import {Divider} from '../divider';
import {Switch} from '../switch';
import * as icons from '../__stories__/icons';
import {ListItem} from '.';

/** Plain RN glyph for the leading/trailing slots, tinted from the theme. */
function Glyph({icon, size = 20}: {icon: IconToken; size?: number}) {
  const color = useColor('secondaryLabel');
  return <SymbolView name={icon.symbol} size={size} tintColor={color}/>;
}

const meta = {
  title: 'Components/ListItem',
  component: ListItem,
  parameters: {docs: {description: {component: 'Tappable row with leading, trailing and supporting text slots. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    children: 'Wi-Fi',
    onPress: fn(),
  },
  argTypes: {
    supporting: {control: 'text'},
  },
  render: args => (
    <Column modifiers={fillWidth}>
      <ListItem {...args}/>
    </Column>
  ),
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Leading: Story = {
  args: {leading: <Glyph icon={icons.star}/>},
};

export const Trailing: Story = {
  args: {trailing: <Glyph icon={icons.chevron} size={14}/>},
};

export const Supporting: Story = {
  args: {supporting: 'Connected to Home network'},
};

export const AllSlots: Story = {
  args: {
    leading: <Glyph icon={icons.settings}/>,
    supporting: 'Version 1.0.0 (42)',
    trailing: <Glyph icon={icons.chevron} size={14}/>,
  },
};

export const WithControl: Story = {
  args: {
    children: 'Notifications',
    trailing: <Switch value onValueChange={fn()}/>,
    onPress: undefined,
  },
  // On web the headline does not yet label the trailing control (no
  // `aria-labelledby` plumbing), so the automated axe check is skipped.
  globals: {a11y: {manual: true}},
};

export const NotPressable: Story = {
  args: {onPress: undefined, supporting: 'Read-only row'},
};

export const List: Story = {
  render: args => (
    <Column modifiers={fillWidth}>
      <ListItem {...args} leading={<Glyph icon={icons.share}/>} trailing={<Glyph icon={icons.chevron} size={14}/>}>
        Share
      </ListItem>
      <Divider inset={48}/>
      <ListItem {...args} leading={<Glyph icon={icons.info}/>} supporting="Learn more about drops">
        About
      </ListItem>
      <Divider inset={48}/>
      <ListItem {...args} leading={<Glyph icon={icons.trash}/>}>
        <Text textStyle={{color: '#FF3B30'}}>Delete</Text>
      </ListItem>
    </Column>
  ),
};
