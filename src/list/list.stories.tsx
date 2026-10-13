import type {Meta, StoryObj} from '@storybook/react-native';
import type {ListProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Host} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {Button} from '../button';
import {EmptyState} from '../empty-state';
import {ListItem} from '../list-item';
import {hostAccentProps} from '../screen/host-accent';
import {Sheet} from '../sheet';
import * as icons from '../__stories__/icons';
import {List} from '.';

interface Version {
  id: string;
  title: string;
  supporting: string;
  size: string;
  unread: boolean;
}

/** Three hundred versions of one document, more than a screen holds. */
const VERSIONS: Version[] = Array.from({length: 300}, (_, index) => ({
  id: `v${300 - index}`,
  title: `Version ${300 - index}`,
  supporting: index === 0 ? 'Edited just now' : `Edited ${index} ${index === 1 ? 'hour' : 'hours'} ago`,
  size: `${12 + ((index * 7) % 40)} KB`,
  unread: index % 9 === 0,
}));

const meta = {
  title: 'Layout/List',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          "A list of rows that grows, as the platform's own lazy list: SwiftUI's `List` on iOS, Compose's `LazyColumn` on Android, a windowed DOM list on web, a windowed `FlatList` on Windows. The rows are `ListItem`s.",
      },
    },
  },
  args: {
    data: VERSIONS,
    keyExtractor: version => version.id,
    renderItem: version => (
      <ListItem icon={icons.info} supporting={version.supporting} value={version.size} badge={version.unread} onPress={() => {}}>
        {version.title}
      </ListItem>
    ),
  },
  render: args => (
    <View style={styles.frame}>
      <List {...args}/>
    </View>
  ),
} satisfies Meta<typeof List<Version>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three hundred rows with the platform's separators between them. */
export const Basic: Story = {};

/** The rows without hairlines, for rows that draw their own edges. */
export const NoSeparators: Story = {args: {separators: false}};

/** Content before the first row and after the last, native on iOS and Android as the rows are. */
export const HeaderAndFooter: Story = {
  args: {
    data: VERSIONS.slice(0, 12),
    header: <ListItem inset supporting="The last twelve, newest first">History</ListItem>,
    footer: <ListItem onPress={() => {}}>Show older versions</ListItem>,
  },
};

/** What the list shows in place of its rows when there are none. */
export const Empty: Story = {
  args: {
    data: [],
    empty: <EmptyState icon={icons.info} title="No versions yet" description="Every save adds one."/>,
  },
};

/** The current row, selected, with the rest around it. */
export const WithSelection: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState(VERSIONS[2]!.id);
    return (
      <View style={styles.frame}>
        <List
          {...args}
          data={VERSIONS.slice(0, 20)}
          renderItem={version => (
            <ListItem selected={version.id === selected} supporting={version.supporting} value={version.size} onPress={() => setSelected(version.id)}>
              {version.title}
            </ListItem>
          )}
        />
      </View>
    );
  },
};

/**
 * Fifty rows as the body of a `Sheet` with `maxHeight`: the list is the cap
 * tall and scrolls inside it, under the sheet's bar. On the web the drawer
 * slides in by a transform, and the list draws the rows in view once it has
 * arrived. The sheet mounts its own host, so the story hosts only the button
 * that opens it.
 */
function InCappedSheet(args: ListProps<Version>) {
  const seed = useAccentSeed();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Host matchContents {...hostAccentProps(seed)}>
        <Button label="Show history" onPress={() => setOpen(true)}/>
      </Host>
      <Sheet isPresented={open} onDismiss={() => setOpen(false)} title="History" subtitle="50 versions" onClose={() => setOpen(false)} maxHeight={360}>
        <List {...args} data={VERSIONS.slice(0, 50)}/>
      </Sheet>
    </>
  );
}

export const InACappedSheet: Story = {
  name: 'In a capped sheet',
  parameters: {native: false},
  render: args => <InCappedSheet {...args}/>,
};

/** A list that loads more: `onEndReached` fires once the last row has been drawn. */
export const LoadsMore: Story = {
  render: function Render(args) {
    const [count, setCount] = useState(30);
    return (
      <View style={styles.frame}>
        <List
          {...args}
          data={VERSIONS.slice(0, count)}
          onEndReached={() => setCount(current => Math.min(current + 30, VERSIONS.length))}
          footer={count < VERSIONS.length ? <ListItem supporting="Loading more">{`${count} of ${VERSIONS.length}`}</ListItem> : undefined}
        />
      </View>
    );
  },
};

const styles = StyleSheet.create({
  frame: {
    height: 420,
    alignSelf: 'stretch',
  },
});
