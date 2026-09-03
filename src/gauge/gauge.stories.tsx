import type {Meta, StoryObj} from '@storybook/react-native';
import type {GaugeProps} from './types';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Gauge} from '.';

const VARIANTS: NonNullable<GaugeProps['variant']>[] = ['automatic', 'linear', 'linearCapacity', 'circular', 'circularCapacity'];

function AllStyles(args: GaugeProps) {
  return (
    <Column modifiers={fillWidth} spacing={24}>
      {VARIANTS.map(variant => <Gauge key={variant} {...args} variant={variant}/>)}
    </Column>
  );
}

const meta = {
  title: 'Components/Gauge',
  component: Gauge,
  parameters: {docs: {description: {component: 'Shows a value within a range in one of the SwiftUI gauge styles: capacity bars, a marker bar, or open and closed rings. SwiftUI on iOS; Android and web redraw the same geometry.'}}},
  args: {
    label: 'Speed',
    value: 211,
    min: 0,
    max: 260,
    currentValueLabel: '211',
    minimumValueLabel: '0',
    maximumValueLabel: '260',
    variant: 'automatic',
  },
  argTypes: {
    accentColor: {control: 'color'},
    variant: {control: 'select', options: VARIANTS},
    value: {control: {type: 'range', min: 0, max: 260, step: 1}},
  },
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Automatic: Story = {};

export const Linear: Story = {
  args: {variant: 'linear'},
};

export const LinearCapacity: Story = {
  args: {variant: 'linearCapacity'},
};

export const Circular: Story = {
  args: {variant: 'circular'},
};

export const CircularCapacity: Story = {
  args: {variant: 'circularCapacity'},
};

export const CustomAccent: Story = {
  args: {accentColor: '#FF9500', variant: 'circularCapacity'},
};

export const Fraction: Story = {
  args: {label: 'Battery', value: 0.72, min: 0, max: 1, currentValueLabel: '72%', minimumValueLabel: undefined, maximumValueLabel: undefined},
};

export const LabelOnly: Story = {
  args: {variant: 'circular', currentValueLabel: undefined, minimumValueLabel: undefined, maximumValueLabel: undefined, label: '°F'},
};

export const Unlabeled: Story = {
  args: {label: undefined, currentValueLabel: undefined, minimumValueLabel: undefined, maximumValueLabel: undefined},
  // A gauge without a label has no accessible name of its own; the surrounding
  // row must name it, so the automated axe check is skipped here.
  globals: {a11y: {manual: true}},
};

export const AllVariants: Story = {
  render: args => <AllStyles {...args}/>,
};
