import type {Meta, StoryObj} from '@storybook/react-native';
import {Column, Row, Text} from '@expo/ui';
import {fillWidth} from '../fill';
import {Footnote} from '../typography';
import {Tooltip} from '.';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    text: 'Anyone with the link can view this drop',
    children: <Text>Public</Text>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: {text: 'Copied'},
};

export const LongText: Story = {
  args: {text: 'Expired drops are kept for 30 days before their files are permanently deleted'},
};

export const OnFootnote: Story = {
  args: {children: <Footnote color="secondaryLabel">What does this mean?</Footnote>},
};

export const Several: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={16}>
      <Row spacing={16}>
        <Tooltip {...args} text="Visible to everyone">
          <Text>Public</Text>
        </Tooltip>
        <Tooltip {...args} text="Only people with the link">
          <Text>Unlisted</Text>
        </Tooltip>
        <Tooltip {...args} text="Only you">
          <Text>Private</Text>
        </Tooltip>
      </Row>
      <Tooltip {...args} text="Files are removed after this date">
        <Footnote color="secondaryLabel">Expires in 7 days</Footnote>
      </Tooltip>
    </Column>
  ),
};
