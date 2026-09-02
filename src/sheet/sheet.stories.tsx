import type {Meta, StoryObj} from '@storybook/react-native';
import type {BottomSheetProps} from '@expo/ui';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column, Host, Row, Text} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {hostAccentProps} from '../screen/host-accent';
import {fillWidth} from '../fill';
import {Button} from '../button';
import {Switch} from '../switch';
import {TextField} from '../text-field';
import {Sheet} from '.';

/**
 * The sheet mounts its own `Host`, so the story opts out of the decorator's
 * Host (`native: false`) and hosts only the trigger button itself.
 */
function Demo({isPresented, onDismiss, children, ...props}: BottomSheetProps) {
  const seed = useAccentSeed();
  const [open, setOpen] = useState(isPresented);
  return (
    <>
      <Host matchContents {...hostAccentProps(seed)}>
        <Button label="Open sheet" onPress={() => setOpen(true)}/>
      </Host>
      <Sheet
        {...props}
        isPresented={open}
        onDismiss={() => {
          setOpen(false);
          onDismiss();
        }}>
        {children}
      </Sheet>
    </>
  );
}

function ShareContent() {
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Text textStyle={{fontSize: 20, fontWeight: '600'}}>Share drop</Text>
      <Text textStyle={{fontSize: 13}}>Anyone with the link can view this drop</Text>
      <Row spacing={8}>
        <Button variant="outlined" label="Copy link" onPress={fn()}/>
        <Button label="Share" onPress={fn()}/>
      </Row>
    </Column>
  );
}

function FormContent() {
  const [name, setName] = useState('');
  const [notify, setNotify] = useState(true);
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Text textStyle={{fontSize: 20, fontWeight: '600'}}>New drop</Text>
      <TextField value={name} placeholder="Name" onChangeText={setName}/>
      <Switch label="Notify collaborators" value={notify} onValueChange={setNotify}/>
      <Button label="Create" onPress={fn()}/>
    </Column>
  );
}

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  parameters: {docs: {description: {component: 'Bottom sheet that inherits the accent color. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}, native: false},
  args: {
    isPresented: false,
    showDragIndicator: true,
    onDismiss: fn(),
    children: <ShareContent/>,
  },
  render: args => <Demo {...args}/>,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: {isPresented: true},
};

export const SnapPoints: Story = {
  args: {isPresented: true, snapPoints: ['half', 'full']},
};

export const NoDragIndicator: Story = {
  args: {isPresented: true, showDragIndicator: false},
};

export const AccentCascade: Story = {
  parameters: {accent: '#8959EA'},
  args: {isPresented: true, children: <FormContent/>},
};
