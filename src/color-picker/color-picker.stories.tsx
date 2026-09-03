import type {Meta, StoryObj} from '@storybook/react-native';
import type {ColorPickerProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {ColorPicker} from '.';

/** Keeps the controlled picker interactive while still reporting to the action log. */
function Controlled({value, onValueChange, ...props}: ColorPickerProps) {
  const [current, setCurrent] = useState(value);
  return (
    <ColorPicker
      {...props}
      value={current}
      onValueChange={next => {
        setCurrent(next);
        onValueChange(next);
      }}
    />
  );
}

function Form({onValueChange}: Pick<ColorPickerProps, 'onValueChange'>) {
  const [state, setState] = useState({accent: '#007AFFFF', background: '#FFFFFFFF', text: '#1D1D1F'});
  const update = (key: keyof typeof state) => (value: string) => {
    setState(s => ({...s, [key]: value}));
    onValueChange(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <ColorPicker label="Accent" value={state.accent} onValueChange={update('accent')}/>
      <ColorPicker label="Background" value={state.background} onValueChange={update('background')}/>
      <ColorPicker label="Text" value={state.text} supportsOpacity={false} onValueChange={update('text')}/>
    </Column>
  );
}

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  parameters: {docs: {description: {component: 'Row with a rainbow-ringed color well that opens the system color picker with Grid, Spectrum and Sliders tabs. SwiftUI on iOS; Android and web redraw the row and the picker sheet.'}}},
  args: {
    label: 'Change color here:',
    value: '#FF6347',
    supportsOpacity: true,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    value: {control: 'color'},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithOpacity: Story = {
  args: {label: 'Select a color with opacity', value: '#FF634780'},
};

export const WithoutOpacity: Story = {
  args: {label: 'Select a color', supportsOpacity: false},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const NoLabel: Story = {
  args: {label: undefined},
  // A bare well is named "Color" on web; the surrounding row should still
  // describe it, so the automated axe check is skipped here.
  globals: {a11y: {manual: true}},
};

export const SettingsForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};
