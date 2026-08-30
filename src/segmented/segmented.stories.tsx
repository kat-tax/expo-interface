import type {Meta, StoryObj} from '@storybook/react-native';
import type {SegmentedControlProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {SegmentedControl} from '.';

/** Keeps the controlled control interactive while still reporting to the action log. */
function Controlled({selectedValue, onValueChange, children, ...props}: SegmentedControlProps) {
  const [value, setValue] = useState(selectedValue);
  return (
    <SegmentedControl
      {...props}
      selectedValue={value}
      onValueChange={next => {
        setValue(next);
        onValueChange?.(next);
      }}>
      {children}
    </SegmentedControl>
  );
}

function Form({onValueChange}: Pick<SegmentedControlProps, 'onValueChange'>) {
  const [state, setState] = useState({view: 'list', sort: 'date', size: 2});
  const update = (key: keyof typeof state) => (value: string | number) => {
    setState(s => ({...s, [key]: value}));
    onValueChange?.(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <SegmentedControl label="View" selectedValue={state.view} onValueChange={update('view')}>
        <SegmentedControl.Item label="List" value="list"/>
        <SegmentedControl.Item label="Grid" value="grid"/>
      </SegmentedControl>
      <SegmentedControl label="Sort by" selectedValue={state.sort} onValueChange={update('sort')}>
        <SegmentedControl.Item label="Date" value="date"/>
        <SegmentedControl.Item label="Name" value="name"/>
        <SegmentedControl.Item label="Size" value="size"/>
      </SegmentedControl>
      <SegmentedControl label="Text size" selectedValue={state.size} onValueChange={update('size')}>
        <SegmentedControl.Item label="S" value={1}/>
        <SegmentedControl.Item label="M" value={2}/>
        <SegmentedControl.Item label="L" value={3}/>
      </SegmentedControl>
    </Column>
  );
}

const items = [
  <SegmentedControl.Item key="day" label="Day" value="day"/>,
  <SegmentedControl.Item key="week" label="Week" value="week"/>,
  <SegmentedControl.Item key="month" label="Month" value="month"/>,
];

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: 'Range',
    selectedValue: 'week',
    disabled: false,
    onValueChange: fn(),
    children: items,
  },
  argTypes: {
    accentColor: {control: 'color'},
    selectedValue: {control: 'select', options: ['day', 'week', 'month']},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoSegments: Story = {
  args: {
    label: 'Units',
    selectedValue: 'metric',
    children: [
      <SegmentedControl.Item key="metric" label="Metric" value="metric"/>,
      <SegmentedControl.Item key="imperial" label="Imperial" value="imperial"/>,
    ],
  },
};

export const Uncontrolled: Story = {
  render: args => (
    <SegmentedControl label={args.label} onValueChange={args.onValueChange}>
      {items}
    </SegmentedControl>
  ),
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const CustomAccent: Story = {
  args: {accentColor: '#FF9500'},
};

export const NoLabel: Story = {
  args: {label: undefined},
};

export const NumericValues: Story = {
  args: {
    label: 'Columns',
    selectedValue: 2,
    children: [
      <SegmentedControl.Item key={1} label="1" value={1}/>,
      <SegmentedControl.Item key={2} label="2" value={2}/>,
      <SegmentedControl.Item key={3} label="3" value={3}/>,
    ],
  },
};

export const SettingsForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};
