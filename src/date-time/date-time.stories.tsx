import type {Meta, StoryObj} from '@storybook/react-native';
import type {DateTimeAnchor, DateTimePickerProps} from './types';
import {fn} from 'storybook/test';
import {useRef, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {useColor} from '../theme';
import {Footnote} from '../typography';
import {DateTimePicker} from '.';

const JUNE_15 = new Date(2026, 5, 15, 9, 30);

/** Keeps the controlled picker interactive while still reporting to the action log. */
function Controlled({value, onChange, ...props}: DateTimePickerProps) {
  const [date, setDate] = useState(value);
  return (
    <DateTimePicker
      {...props}
      value={date}
      onChange={(next, day) => {
        setDate(next);
        onChange?.(next, day);
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
  const update = (key: keyof typeof state) => (date: Date, day: string) => {
    setState(s => ({...s, [key]: date}));
    onChange?.(date, day);
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
  title: 'Controls/DateTimePicker',
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

/**
 * A due date kept as a day, `YYYY-MM-DD`, in a chip on a canvas: pressing the
 * chip presents the platform's own picker from it, and a picked day closes it.
 */
function DueChip({onChange}: Pick<DateTimePickerProps, 'onChange'>) {
  const [due, setDue] = useState('2026-06-15');
  const [at, setAt] = useState<DateTimeAnchor | null>(null);
  // Where the chip was laid out, which the picker opens from.
  const chipRect = useRef<DateTimeAnchor>({x: 12, y: 12, width: 120, height: 28});
  const fill = useColor('backgroundElement');
  return (
    <View style={styles.canvas}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Due ${due}`}
        style={[styles.chip, {backgroundColor: fill}]}
        onLayout={event => {
          const {x, y, width, height} = event.nativeEvent.layout;
          chipRect.current = {x, y, width, height};
        }}
        onPress={() => setAt(chipRect.current)}>
        <Footnote color="label">{`Due ${due}`}</Footnote>
      </Pressable>
      <DateTimePicker
        mode="date"
        value={due}
        presented={at !== null}
        at={at}
        onChange={(date, day) => {
          setDue(day);
          onChange?.(date, day);
        }}
        onDismiss={() => setAt(null)}
      />
    </View>
  );
}

export const PresentedFromAChip: Story = {
  render: args => <DueChip onChange={args.onChange}/>,
};

const styles = StyleSheet.create({
  canvas: {height: 380, padding: 12, alignSelf: 'stretch'},
  chip: {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8},
});
