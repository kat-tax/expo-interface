import type {Meta, StoryObj} from '@storybook/react-native';
import type {DateTimePickerProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {DateTimePicker} from '.';

const JUNE_15 = new Date(2026, 5, 15, 9, 30);

/** Keeps the controlled picker interactive while still reporting to the action log. */
function Controlled({value, onChange, ...props}: DateTimePickerProps) {
  const [date, setDate] = useState(value);
  return (
    <DateTimePicker
      {...props}
      value={date}
      onChange={next => {
        setDate(next);
        onChange?.(next);
      }}
    />
  );
}

function Form({onChange}: Pick<DateTimePickerProps, 'onChange'>) {
  const [state, setState] = useState({
    start: new Date(2026, 5, 15, 9, 0),
    end: new Date(2026, 5, 15, 17, 0),
    reminder: new Date(2026, 5, 14, 8, 0),
  });
  const update = (key: keyof typeof state) => (date: Date) => {
    setState(s => ({...s, [key]: date}));
    onChange?.(date);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <DateTimePicker label="Starts" value={state.start} onChange={update('start')}/>
      <DateTimePicker label="Ends" value={state.end} minimumDate={state.start} onChange={update('end')}/>
      <DateTimePicker label="Reminder" mode="time" value={state.reminder} onChange={update('reminder')}/>
    </Column>
  );
}

const meta = {
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
  parameters: {docs: {description: {component: 'Picks a date, a time or both, with optional bounds. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Starts',
    value: JUNE_15,
    mode: 'datetime',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    mode: {control: 'select', options: ['date', 'time', 'datetime']},
    accentColor: {control: 'color'},
    value: {control: 'date'},
    minimumDate: {control: 'date'},
    maximumDate: {control: 'date'},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DateAndTime: Story = {};

export const DateOnly: Story = {
  args: {label: 'Birthday', mode: 'date'},
};

export const TimeOnly: Story = {
  args: {label: 'Alarm', mode: 'time'},
};

export const WithRange: Story = {
  args: {
    label: 'Check-in',
    mode: 'date',
    minimumDate: new Date(2026, 5, 1),
    maximumDate: new Date(2026, 5, 30),
  },
};

export const Uncontrolled: Story = {
  render: args => <DateTimePicker label={args.label} mode={args.mode} onChange={args.onChange}/>,
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

export const EventForm: Story = {
  render: args => <Form onChange={args.onChange}/>,
};
