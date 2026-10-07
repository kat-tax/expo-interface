import type {Meta, StoryObj} from '@storybook/react-native';
import type {ComposerProps} from './types';
import {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {fn} from 'storybook/test';
import {Footnote} from '../typography';
import * as icons from '../__stories__/icons';
import {Composer} from '.';

/** A thread that answers each message after a moment, which is when the send button is a stop button. */
function Thread({onSend, onStop, ...props}: ComposerProps) {
  const [lines, setLines] = useState<string[]>(['How do I share a drop?']);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => {
      setLines(current => [...current, 'Open the drop and press Share.']);
      setBusy(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [busy]);
  return (
    <View style={styles.thread}>
      {lines.map((line, index) => (
        <Footnote key={index} color={index % 2 === 0 ? 'label' : 'secondaryLabel'}>{line}</Footnote>
      ))}
      <Composer
        {...props}
        busy={busy}
        onSend={text => {
          setLines(current => [...current, text]);
          setBusy(true);
          onSend(text);
        }}
        onStop={() => {
          setBusy(false);
          onStop?.();
        }}
      />
    </View>
  );
}

const meta = {
  title: 'Controls/Composer',
  component: Composer,
  parameters: {native: false, docs: {description: {component: 'A capsule to write a message in, with a send button that is a stop button while something runs: the bottom of a conversation, a comment thread, an assistant\'s prompt. Drawn in React Native on every platform around a bare `TextField` and the kit\'s circle `Button`, so it sits in a `Sheet`\'s footer or at the bottom of a screen.'}}},
  args: {
    placeholder: 'Ask anything',
    notice: 'Enter sends, Shift+Enter starts a new line.',
    onSend: fn(),
    onStop: fn(),
  },
  render: args => <Thread {...args}/>,
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Write and send; the button fills once there is something to send, and is a stop button while the answer comes. */
export const Conversation: Story = {};

/** The capsule alone, with nothing under it. */
export const Bare: Story = {
  args: {notice: undefined, placeholder: 'Reply'},
  render: args => <Composer {...args}/>,
};

/** An assistant's prompt, with a menu at the leading edge for what the message goes to. */
export const WithAMenu: Story = {
  args: {
    notice: undefined,
    placeholder: 'Ask about this document',
    menu: {label: 'Ask', icon: icons.info, items: [{label: 'This page', active: true}, {label: 'The whole document'}, {label: 'The web'}]},
  },
  render: args => <Composer {...args}/>,
};

/** Nothing can be written or sent. */
export const Disabled: Story = {
  args: {disabled: true, notice: 'Comments are closed.'},
  render: args => <Composer {...args}/>,
};

const styles = StyleSheet.create({
  thread: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
