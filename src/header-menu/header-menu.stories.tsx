import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import * as icons from '../__stories__/icons';
import {RouterApp, headerApp} from '../__stories__/router';
import {HeaderMenu} from '.';

const meta = {
  title: 'Navigation/HeaderMenu',
  component: HeaderMenu,
  parameters: {
    docs: {description: {component: 'A `Menu` for a stack header’s trailing slot, at the platform’s header size and in a host of its own. The stories put it in a real header, which is what it reads its focus and its metrics from.'}},
    // The control mounts the host it needs; the screens around it are plain.
    native: false,
    // The app fills what it is given, so a docs page has to give it a size.
    height: 360,
  },
  args: {
    label: 'Export',
    icon: icons.share,
    hideLabel: true,
    items: [{label: 'PDF'}, {label: 'Markdown'}, {label: 'Delete', icon: icons.trash, role: 'destructive', separator: true}],
    onOpenChange: fn(),
  },
  render: args => (
    <RouterApp routes={headerApp('Holiday photos', '12 files, shared until Friday.', () => <HeaderMenu {...args}/>)}/>
  ),
} satisfies Meta<typeof HeaderMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The icon trigger, which is what a header usually has room for. */
export const Default: Story = {};

/** The label shown beside the icon. */
export const Labelled: Story = {
  args: {hideLabel: false},
};

/** In the label color rather than the accent, like the header’s own controls. */
export const Label: Story = {
  args: {hideLabel: false, tone: 'label'},
};
