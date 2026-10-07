import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Body} from '../typography';
import {FindBar} from '.';

const TEXT = 'The quick brown fox jumps over the lazy dog. The dog sleeps; the fox runs on, and the day goes on the way the days do.';

/** A document the bar finds in: the matches are counted here, as an app would. */
function Document({onClose}: {onClose?: () => void}) {
  const [query, setQuery] = useState('the');
  const [current, setCurrent] = useState(1);
  const total = query ? TEXT.toLowerCase().split(query.toLowerCase()).length - 1 : 0;
  const step = (by: number) => setCurrent(at => (total === 0 ? 0 : ((at - 1 + by + total) % total) + 1));
  return (
    <View style={styles.page}>
      <FindBar
        value={query}
        onChangeText={next => {
          setQuery(next);
          setCurrent(1);
        }}
        matches={query ? {current: total === 0 ? 0 : Math.min(current, total), total} : null}
        onNext={() => step(1)}
        onPrevious={() => step(-1)}
        onClose={onClose}
        autoFocus={false}
      />
      <Body color="label" style={styles.text}>{TEXT}</Body>
    </View>
  );
}

const meta = {
  title: 'Layout/FindBar',
  component: FindBar,
  parameters: {native: false, docs: {description: {component: 'A bar to find text in what a screen shows: a field, the count of matches, previous, next and close, at the bar\'s metrics. The finding is the app\'s; the bar says where it has got to. Enter goes to the next match, Shift+Enter to the previous, Escape closes.'}}},
  args: {
    onClose: fn(),
  },
  render: args => <Document onClose={args.onClose}/>,
} satisfies Meta<typeof FindBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type to find; the count follows, and previous and next step through the matches. */
export const InADocument: Story = {};

/** Nothing for the text: the count says so, and previous and next wait. */
export const NoMatches: Story = {
  render: () => <FindBar value="zebra" matches={{current: 0, total: 0}} autoFocus={false}/>,
};

const styles = StyleSheet.create({
  page: {alignSelf: 'stretch', gap: 12},
  text: {paddingHorizontal: 12},
});
