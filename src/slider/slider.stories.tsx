import type {Meta, StoryObj} from '@storybook/react-native';
import type {SliderProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Slider} from '.';

/** Keeps the controlled slider interactive while still reporting to the action log. */
function Controlled({value, onValueChange, ...props}: SliderProps) {
  const [current, setCurrent] = useState(value);
  return (
    <Slider
      {...props}
      value={current}
      onValueChange={next => {
        setCurrent(next);
        onValueChange(next);
      }}
    />
  );
}

function Form({onValueChange, onSlidingComplete}: Pick<SliderProps, 'onValueChange' | 'onSlidingComplete'>) {
  const [state, setState] = useState({brightness: 0.7, volume: 40, speed: 1.5});
  const update = (key: keyof typeof state) => (value: number) => {
    setState(s => ({...s, [key]: value}));
    onValueChange(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Slider
        label="Brightness"
        value={state.brightness}
        onValueChange={update('brightness')}
        onSlidingComplete={onSlidingComplete}
      />
      <Slider
        label="Volume"
        value={state.volume}
        min={0}
        max={100}
        step={5}
        onValueChange={update('volume')}
        onSlidingComplete={onSlidingComplete}
      />
      <Slider
        label="Speed"
        value={state.speed}
        min={0.5}
        max={2}
        step={0.25}
        onValueChange={update('speed')}
        onSlidingComplete={onSlidingComplete}
      />
    </Column>
  );
}

const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {docs: {description: {component: 'Thumb dragged along a continuous or stepped range. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Brightness',
    value: 0.5,
    min: 0,
    max: 1,
    disabled: false,
    onValueChange: fn(),
    onSlidingComplete: fn(),
  },
  argTypes: {
    accentColor: {control: 'color'},
    value: {control: {type: 'number', step: 0.01}},
    step: {control: {type: 'number', step: 0.01}},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Continuous: Story = {};

export const Stepped: Story = {
  args: {label: 'Volume', value: 40, min: 0, max: 100, step: 10},
};

export const CustomRange: Story = {
  args: {label: 'Temperature', value: 21, min: 16, max: 30, step: 0.5},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const CustomAccent: Story = {
  args: {label: 'Warmth', accentColor: '#FF9500'},
};

export const NoLabel: Story = {
  args: {label: undefined},
  // A bare slider has no accessible name of its own; the surrounding row (a
  // `ListItem`) must name it, so the automated axe check is skipped here.
  globals: {a11y: {manual: true}},
};

export const SettingsForm: Story = {
  render: args => <Form onValueChange={args.onValueChange} onSlidingComplete={args.onSlidingComplete}/>,
};
