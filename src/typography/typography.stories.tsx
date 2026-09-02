import type {Meta, StoryObj} from '@storybook/react-native';
import {View} from 'react-native';
import {
  Typography,
  LargeTitle,
  Title,
  Title2,
  Title3,
  Headline,
  Body,
  Callout,
  Subheadline,
  Footnote,
  Caption,
  Label,
} from '.';

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

const meta = {
  title: 'Components/Typography',
  component: Typography,
  parameters: {docs: {description: {component: 'Text in the platform type scale, with `Title`, `Body`, `Caption` and other variants as shortcuts.'}}, native: false},
  args: {
    children: SAMPLE,
    variant: 'body',
    color: 'label',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'largeTitle', 'title', 'title2', 'title3', 'headline', 'body',
        'callout', 'subheadline', 'footnote', 'caption', 'label',
      ],
    },
    weight: {control: 'select', options: [undefined, 'normal', 'medium', 'semibold', 'bold']},
    align: {control: 'select', options: [undefined, 'left', 'center', 'right']},
    color: {
      control: 'select',
      options: ['label', 'secondaryLabel', 'tertiaryLabel', 'tint', 'destructive'],
    },
    numberOfLines: {control: 'number'},
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LargeTitleVariant: Story = {
  name: 'LargeTitle',
  args: {variant: 'largeTitle'},
};

export const TitleVariant: Story = {
  name: 'Title',
  args: {variant: 'title'},
};

export const Title2Variant: Story = {
  name: 'Title2',
  args: {variant: 'title2'},
};

export const Title3Variant: Story = {
  name: 'Title3',
  args: {variant: 'title3'},
};

export const HeadlineVariant: Story = {
  name: 'Headline',
  args: {variant: 'headline'},
};

export const BodyVariant: Story = {
  name: 'Body',
  args: {variant: 'body'},
};

export const CalloutVariant: Story = {
  name: 'Callout',
  args: {variant: 'callout'},
};

export const SubheadlineVariant: Story = {
  name: 'Subheadline',
  args: {variant: 'subheadline'},
};

export const FootnoteVariant: Story = {
  name: 'Footnote',
  args: {variant: 'footnote'},
};

export const CaptionVariant: Story = {
  name: 'Caption',
  args: {variant: 'caption'},
};

export const LabelVariant: Story = {
  name: 'Label',
  args: {variant: 'label'},
};

export const Scale: Story = {
  render: ({children}) => (
    <View style={{gap: 12}}>
      <LargeTitle>{children}</LargeTitle>
      <Title>{children}</Title>
      <Title2>{children}</Title2>
      <Title3>{children}</Title3>
      <Headline>{children}</Headline>
      <Body>{children}</Body>
      <Callout>{children}</Callout>
      <Subheadline>{children}</Subheadline>
      <Footnote>{children}</Footnote>
      <Caption>{children}</Caption>
      <Label>{children}</Label>
    </View>
  ),
};

export const Weights: Story = {
  render: args => (
    <View style={{gap: 8}}>
      <Typography {...args} weight="normal">Normal 400</Typography>
      <Typography {...args} weight="medium">Medium 500</Typography>
      <Typography {...args} weight="semibold">Semibold 600</Typography>
      <Typography {...args} weight="bold">Bold 700</Typography>
    </View>
  ),
};

export const Colors: Story = {
  render: args => (
    <View style={{gap: 8}}>
      <Typography {...args} color="label">label</Typography>
      <Typography {...args} color="secondaryLabel">secondaryLabel</Typography>
      <Typography {...args} color="tertiaryLabel">tertiaryLabel</Typography>
      <Typography {...args} color="tint">tint</Typography>
      <Typography {...args} color="destructive">destructive</Typography>
    </View>
  ),
};

export const Alignment: Story = {
  render: args => (
    <View style={{gap: 8}}>
      <Typography {...args} align="left">Left aligned</Typography>
      <Typography {...args} align="center">Center aligned</Typography>
      <Typography {...args} align="right">Right aligned</Typography>
    </View>
  ),
};

export const Truncated: Story = {
  args: {
    numberOfLines: 1,
    children: `${SAMPLE}. ${SAMPLE}. ${SAMPLE}.`,
  },
  render: args => (
    <View style={{width: 240}}>
      <Typography {...args}/>
      <Typography {...args} numberOfLines={2}/>
    </View>
  ),
};
