import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import * as icons from '../__stories__/icons';
import {RouterApp, headerApp} from '../__stories__/router';
import {HeaderAction} from '.';

const meta = {
  title: 'Navigation/HeaderAction',
  component: HeaderAction,
  parameters: {
    docs: {description: {component: 'A plain press in a stack header’s trailing slot: `HeaderMenu` without the menu, at the platform’s header size and in the same host. The stories put it in a real header, which is what it reads its focus and its metrics from.'}},
    // The control mounts the host it needs; the screens around it are plain.
    native: false,
    // The app fills what it is given, so a docs page has to give it a size.
    height: 360,
  },
  args: {
    label: 'Share',
    icon: icons.share,
    hideLabel: true,
    onPress: fn(),
  },
  render: args => (
    <RouterApp routes={headerApp('Holiday photos', '12 files, shared until Friday.', () => <HeaderAction {...args}/>)}/>
  ),
} satisfies Meta<typeof HeaderAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The icon trigger, which is what a header usually has room for. */
export const Default: Story = {};

/** The label instead of the icon, for an action a glyph cannot name. */
export const Labelled: Story = {
  args: {label: 'Done', icon: undefined, hideLabel: false},
};

/** Disabled, until the screen has something for it to do. */
export const Disabled: Story = {
  args: {label: 'Done', icon: undefined, hideLabel: false, disabled: true},
};
