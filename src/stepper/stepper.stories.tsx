import type {Meta, StoryObj} from '@storybook/react-native';
import type {StepperProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Stepper} from '.';

/** Keeps the controlled stepper interactive while still reporting to the action log. */
function Controlled({value, onValueChange, ...props}: StepperProps) {
  const [current, setCurrent] = useState(value);
  return (
    <Stepper
      {...props}
      value={current}
      onValueChange={next => {
        setCurrent(next);
        onValueChange(next);
      }}
    />
  );
}

function Form({onValueChange}: Pick<StepperProps, 'onValueChange'>) {
  const [state, setState] = useState({adults: 2, children: 0, rooms: 1});
  const update = (key: keyof typeof state) => (value: number) => {
    setState(s => ({...s, [key]: value}));
    onValueChange(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Stepper label="Adults" value={state.adults} min={1} max={8} onValueChange={update('adults')}/>
      <Stepper label="Children" value={state.children} min={0} max={6} onValueChange={update('children')}/>
      <Stepper label="Rooms" value={state.rooms} min={1} max={4} onValueChange={update('rooms')}/>
    </Column>
  );
}

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  args: {
    label: 'Quantity',
    value: 1,
    step: 1,
    disabled: false,
    onValueChange: fn(),
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bounded: Story = {
  args: {label: 'Guests', value: 2, min: 1, max: 6},
};

export const AtMinimum: Story = {
  args: {label: 'Guests', value: 1, min: 1, max: 6},
};

export const AtMaximum: Story = {
  args: {label: 'Guests', value: 6, min: 1, max: 6},
};

export const CustomStep: Story = {
  args: {label: 'Font size', value: 16, step: 2, min: 10, max: 32},
};

export const FractionalStep: Story = {
  args: {label: 'Line height', value: 1.5, step: 0.1, min: 1, max: 2},
};

export const FormattedValue: Story = {
  args: {label: 'Zoom', value: 100, step: 25, min: 25, max: 400, formatValue: (v: number) => `${v}%`},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const NoLabel: Story = {
  args: {label: undefined},
};

export const BookingForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};
