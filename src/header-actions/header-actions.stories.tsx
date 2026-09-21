import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {HeaderAction} from '../header-action';
import {HeaderMenu} from '../header-menu';
import * as icons from '../__stories__/icons';
import {RouterApp, headerApp} from '../__stories__/router';
import {HeaderActions} from '.';

const items = [{label: 'PDF'}, {label: 'Markdown'}];

const meta = {
  title: 'Navigation/HeaderActions',
  component: HeaderActions,
  parameters: {
    docs: {story: {inline: false, height: '380px'}, description: {component: 'More than one control in a stack header’s trailing slot, which takes a single node: a row spaced the way each platform spaces its own header actions, and the one host all of them share.'}},
    // The row mounts the host its controls need; the screens around it are plain.
    native: false,
  },
  render: args => (
    <RouterApp
      routes={headerApp('Holiday photos', '12 files, shared until Friday.', () => (
        <HeaderActions {...args}>
          <HeaderAction label="Star" icon={icons.star} hideLabel onPress={fn()}/>
          <HeaderAction label="Share" icon={icons.share} hideLabel onPress={fn()}/>
          <HeaderMenu label="Export" icon={icons.add} hideLabel items={items}/>
        </HeaderActions>
      ))}
    />
  ),
} satisfies Meta<typeof HeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two presses and a menu, at the pitch the platform puts between its own. */
export const Default: Story = {};
