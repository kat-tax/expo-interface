import type {Meta, StoryObj} from '@storybook/react-native';
import type {CollapsibleProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Button} from '../button';
import {Body, Footnote} from '../typography';
import {Collapsible} from '.';

/** Drives `expanded` from the outside so the controlled story still toggles. */
function Controlled({expanded, onExpandedChange, children, ...props}: CollapsibleProps) {
  const [open, setOpen] = useState(expanded ?? false);
  const change = (next: boolean) => {
    setOpen(next);
    onExpandedChange?.(next);
  };
  return (
    <Column modifiers={fillWidth} spacing={12}>
      <Button label={open ? 'Collapse' : 'Expand'} variant="outlined" onPress={() => change(!open)}/>
      <Collapsible {...props} expanded={open} onExpandedChange={change}>
        {children}
      </Collapsible>
    </Column>
  );
}

const FAQ = [
  {q: 'How long are drops kept?', a: 'Drops expire after 7 days by default. You can extend or shorten this per drop.'},
  {q: 'Can I password-protect a drop?', a: 'Yes. Turn on "Require password" in the drop settings before sharing the link.'},
  {q: 'What is the maximum file size?', a: 'Each file can be up to 2 GB; a drop can hold up to 50 files.'},
];

function Faq({onExpandedChange}: Pick<CollapsibleProps, 'onExpandedChange'>) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Column modifiers={fillWidth} spacing={8}>
      {FAQ.map((item, index) => (
        <Collapsible
          key={index}
          label={item.q}
          expanded={open === index}
          onExpandedChange={next => {
            setOpen(next ? index : null);
            onExpandedChange?.(next);
          }}>
          <Body color="secondaryLabel">{item.a}</Body>
        </Collapsible>
      ))}
    </Column>
  );
}

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {docs: {description: {component: 'Row that expands and collapses its content. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Version 1.0.0',
    defaultExpanded: false,
    onExpandedChange: fn(),
  },
  render: args => (
    <Collapsible {...args}>
      <Footnote color="secondaryLabel">Built with expo-interface on @expo/ui.</Footnote>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  args: {defaultExpanded: true},
};

export const LongContent: Story = {
  args: {label: 'Terms of service', defaultExpanded: true},
  render: args => (
    <Collapsible {...args}>
      <Body color="secondaryLabel">
        By uploading files you confirm that you own them or have permission to share them. Drops are
        deleted when they expire, and deleted files cannot be recovered. We never look at the contents
        of your files.
      </Body>
    </Collapsible>
  ),
};

export const Controlled_: Story = {
  name: 'Controlled',
  args: {label: 'Advanced options', expanded: false},
  render: args => (
    <Controlled {...args}>
      <Footnote color="secondaryLabel">Toggle the button or the header; both stay in sync.</Footnote>
    </Controlled>
  ),
};

export const Faq_: Story = {
  name: 'FAQ',
  render: args => <Faq onExpandedChange={args.onExpandedChange}/>,
};
