import type {Meta, StoryObj} from '@storybook/react-native';
import type {ColorPickerProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column, Host} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {Button} from '../button';
import {fillWidth} from '../fill';
import {hostAccentProps} from '../screen/host-accent';
import {Sheet} from '../sheet';
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

/**
 * The picker drawn in place in a sheet of the app's own, which `inline` is
 * for: the sheet's bar titles it, and a drag across the spectrum or a slider
 * stays with the picker rather than moving the sheet. The sheet mounts its
 * own `Host`, so the story hosts only the button that opens it.
 */
function InSheet(props: ColorPickerProps) {
  const seed = useAccentSeed();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Host matchContents {...hostAccentProps(seed)}>
        <Button label="Cell color" onPress={() => setOpen(true)}/>
      </Host>
      <Sheet isPresented={open} onDismiss={() => setOpen(false)} title="Cell color" onClose={() => setOpen(false)}>
        <Controlled {...props} presentation="inline"/>
      </Sheet>
    </>
  );
}

const meta = {
  title: 'Controls/ColorPicker',
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

export const WithSwatches: Story = {
  args: {
    label: 'Accent',
    value: '#007AFF',
    supportsOpacity: false,
    swatches: ['#007AFF', '#6750A4', '#0B6E4F', '#B3261E', '#C2410C'],
  },
};

export const NamedSwatchMenu: Story = {
  args: {
    label: 'Ink',
    value: '#1D1D1F',
    presentation: 'menu',
    allowsNone: true,
    supportsOpacity: false,
    swatches: [
      {color: '#1D1D1F', name: 'Black'},
      {color: '#0A84FF', name: 'Blue'},
      {color: '#D70015', name: 'Red'},
      {color: '#248A3D', name: 'Green'},
    ],
  },
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

export const InASheet: Story = {
  parameters: {native: false},
  args: {label: undefined, value: '#FF6347', swatches: ['#FF6347', '#007AFF', '#34C759', '#AF52DE']},
  render: args => <InSheet {...args}/>,
};
