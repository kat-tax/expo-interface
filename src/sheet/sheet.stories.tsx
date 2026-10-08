import type {Meta, StoryObj} from '@storybook/react-native';
import type {SheetProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Column, Host, Row, Text} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {useColor} from '../theme';
import {hostAccentProps} from '../screen/host-accent';
import {fillWidth} from '../fill';
import {Button} from '../button';
import {Composer} from '../composer';
import {SegmentedControl} from '../segmented';
import {Switch} from '../switch';
import {TextField} from '../text-field';
import {Footnote} from '../typography';
import {Sheet} from '.';

/**
 * The sheet mounts its own `Host`, so the story opts out of the decorator's
 * Host (`native: false`) and hosts only the trigger button itself.
 */
function Demo({isPresented, onDismiss, children, ...props}: SheetProps) {
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
  title: 'Overlays/Sheet',
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

export const Default: Story = {};

export const SnapPoints: Story = {
  args: {snapPoints: ['half', 'full']},
};

export const NoDragIndicator: Story = {
  args: {showDragIndicator: false},
};

export const AccentCascade: Story = {
  parameters: {accent: '#8959EA'},
  args: {children: <FormContent/>},
};

/**
 * A material lets what is behind the sheet show through it: SwiftUI's own on
 * iOS, `backdrop-filter` on web. Android and Windows stay opaque — Compose's
 * `ModalBottomSheet` takes a container colour and nothing else, and the
 * Windows sheet is drawn in a React Native layer because its content is React
 * Native's, so there is no XAML surface to put an acrylic brush on.
 */
export const Material: Story = {
  args: {material: 'regular'},
};

export const ThinMaterial: Story = {
  args: {material: 'thin'},
};

/**
 * The bar along the top: the title over the subtitle, a back button at the
 * leading edge, the sheet's menu and a close button at the trailing edge.
 * SwiftUI content on iOS, Compose content on Android, the kit's on web and
 * Windows.
 */
export const TitleBar: Story = {
  args: {
    title: 'Comments',
    subtitle: '12 unresolved',
    onBack: fn(),
    onClose: fn(),
    menu: [{label: 'Resolve all'}, {label: 'Copy link'}],
    children: <FormContent/>,
  },
};

/** Buttons along the bottom edge: the last one filled, the rest outlined. */
export const WithActions: Story = {
  args: {
    title: 'New drop',
    onClose: fn(),
    actions: [{label: 'Cancel', onPress: fn()}, {label: 'Create', onPress: fn()}],
    children: <FormContent/>,
  },
};

/** Forty rows, which a cap on the body's height scrolls inside the sheet. */
function Rows() {
  return (
    <View style={styles.rows}>
      {Array.from({length: 40}, (_, index) => (
        <Footnote key={index} color={index % 2 === 0 ? 'label' : 'secondaryLabel'}>{`Version ${40 - index}`}</Footnote>
      ))}
    </View>
  );
}

/**
 * A sheet that fits its content stops at `maxHeight`, and the body scrolls
 * inside, as React Native content the width of the sheet.
 */
export const Capped: Story = {
  args: {
    title: 'History',
    onClose: fn(),
    maxHeight: 320,
    children: <Rows/>,
  },
};

/** The cap as a fraction of the window's height: half of it, whatever the device. */
export const CappedToFraction: Story = {
  args: {
    title: 'History',
    onClose: fn(),
    maxHeight: {fraction: 0.5},
    children: <Rows/>,
  },
};

/**
 * Twenty comments, each a row that takes a press: on iOS and Android the
 * capped body is hosted in the sheet, which is what lets a `Pressable` in
 * it press.
 */
function Comments() {
  const pressed = useColor('backgroundSelected');
  return (
    <View style={styles.rows}>
      {Array.from({length: 20}, (_, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          onPress={fn()}
          style={state => [styles.comment, state.pressed ? {backgroundColor: pressed} : null]}>
          <Footnote color="label">{`Comment ${index + 1}`}</Footnote>
          <Footnote color="secondaryLabel">Press to open the thread</Footnote>
        </Pressable>
      ))}
    </View>
  );
}

/** The comment thread: a filter under the bar, the thread, and a composer pinned under it. */
function Thread() {
  const [filter, setFilter] = useState('open');
  return (
    <Sheet
      isPresented
      onDismiss={fn()}
      title="Comments"
      subtitle="12 unresolved"
      onClose={fn()}
      accessory={
        <SegmentedControl label="Show" selectedValue={filter} onValueChange={setFilter}>
          <SegmentedControl.Item label="Open" value="open"/>
          <SegmentedControl.Item label="Resolved" value="resolved"/>
        </SegmentedControl>
      }
      footer={<Composer placeholder="Reply" onSend={fn()}/>}
      maxHeight={360}>
      <Comments/>
    </Sheet>
  );
}

export const Conversation: Story = {
  render: () => <Thread/>,
};

const styles = StyleSheet.create({
  rows: {
    width: '100%',
    gap: 8,
    paddingVertical: 8,
  },
  comment: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
