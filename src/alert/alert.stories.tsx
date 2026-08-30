import type {Meta, StoryObj} from '@storybook/react-native';
import type {AlertProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import * as icons from '../__stories__/icons';
import {Button} from '../button';
import {Footnote} from '../typography';
import {Alert} from '.';

interface DemoProps extends AlertProps {
  /** Label of the button that presents the alert. */
  trigger?: string;
}

/** Presents the alert from a trigger button and closes it again on dismiss. */
function Demo({visible: initial, onDismiss, trigger = 'Show alert', children, ...props}: DemoProps) {
  const [visible, setVisible] = useState(initial);
  return (
    <Alert
      {...props}
      visible={visible}
      onDismiss={() => {
        setVisible(false);
        onDismiss?.();
      }}>
      {children ?? <Button label={trigger} variant="outlined" onPress={() => setVisible(true)}/>}
    </Alert>
  );
}

function DeleteAccount({onDismiss}: Pick<AlertProps, 'onDismiss'>) {
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState('Your account is active.');
  return (
    <Column modifiers={fillWidth} spacing={12}>
      <Footnote color="secondaryLabel">{status}</Footnote>
      <Alert
        title="Delete account?"
        message="This removes every drop and file. It cannot be undone."
        visible={confirm}
        onDismiss={() => {
          setConfirm(false);
          onDismiss?.();
        }}
        actions={[
          {label: 'Cancel', role: 'cancel', onPress: () => setStatus('Kept your account.')},
          {label: 'Delete', role: 'destructive', onPress: () => setStatus('Account scheduled for deletion.')},
        ]}>
        <Button
          label="Delete account"
          variant="text"
          role="destructive"
          prefixIcon={icons.trash}
          onPress={() => setConfirm(true)}
        />
      </Alert>
    </Column>
  );
}

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: {
    title: 'Upload complete',
    message: '3 files were added to Holiday photos.',
    visible: false,
    sheet: false,
    onDismiss: fn(),
  },
  render: args => <Demo {...args}/>,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {title: 'Link copied', message: undefined},
};

export const Confirm: Story = {
  args: {
    title: 'Delete drop?',
    message: 'The files in this drop will be removed for everyone.',
    actions: [
      {label: 'Cancel', role: 'cancel', onPress: fn()},
      {label: 'Delete', role: 'destructive', onPress: fn()},
    ],
  },
};

export const ThreeActions: Story = {
  args: {
    title: 'Unsaved changes',
    message: 'Save your changes before leaving?',
    actions: [
      {label: 'Cancel', role: 'cancel', onPress: fn()},
      {label: "Don't save", role: 'destructive', onPress: fn()},
      {label: 'Save', onPress: fn()},
    ],
  },
};

export const NoCancel: Story = {
  args: {
    title: 'Choose a layout',
    message: undefined,
    actions: [
      {label: 'List', onPress: fn()},
      {label: 'Grid', onPress: fn()},
    ],
  },
};

export const Sheet: Story = {
  args: {
    title: 'Share drop',
    message: 'Choose how to share Holiday photos.',
    sheet: true,
    actions: [
      {label: 'Copy link', onPress: fn()},
      {label: 'Share…', onPress: fn()},
      {label: 'Cancel', role: 'cancel', onPress: fn()},
    ],
  },
};

export const SheetDestructive: Story = {
  args: {
    title: 'Remove 3 files?',
    message: undefined,
    sheet: true,
    actions: [
      {label: 'Remove from drop', role: 'destructive', onPress: fn()},
      {label: 'Delete permanently', role: 'destructive', onPress: fn()},
      {label: 'Cancel', role: 'cancel', onPress: fn()},
    ],
  },
};

export const InitiallyVisible: Story = {
  args: {visible: true},
};

export const DeleteAccountFlow: Story = {
  render: args => <DeleteAccount onDismiss={args.onDismiss}/>,
};
