import type {Meta, StoryObj} from '@storybook/react-native';
import type {TabViewTab} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Body, Title2} from '../typography';
import {spacing, useColor} from '../theme';
import {nextSelection} from './shared';
import {TabView} from '.';

const OPEN: readonly TabViewTab[] = [
  {id: 'readme', title: 'README.md', icon: {symbol: {ios: 'doc.text', android: 'description', web: 'description'}}},
  {id: 'index', title: 'index.tsx', icon: {symbol: {ios: 'chevron.left.forwardslash.chevron.right', android: 'code', web: 'code'}}},
  {id: 'notes', title: 'A rather long note about something', icon: {symbol: {ios: 'note.text', android: 'edit', web: 'edit'}}},
];

/** The open document, which is ordinary content under the strip. */
function Page({tab}: {tab: TabViewTab | undefined}) {
  const background = useColor('background');
  return (
    <View style={[styles.page, {backgroundColor: background}]}>
      <Title2>{tab ? tab.title : 'Nothing open'}</Title2>
      <Body>
        {tab
          ? 'The page is React Native on every platform, including inside the Windows island’s strip, which is why the strip is the only part a control draws.'
          : 'Every tab was closed. Add one to start again.'}
      </Body>
    </View>
  );
}

const meta = {
  title: 'Components/TabView',
  component: TabView,
  parameters: {
    docs: {
      description: {
        component:
          "Document tabs — the ones a user opens and closes, not the app's sections, which are `Tabs`. Windows draws a real WinUI 3 `TabView` for the strip, the one platform with a control for this; iOS, Android and web draw theirs, because SwiftUI's `TabView` and Compose's `TabRow` are both the navigation kind and no browser lends a page its own strip. Under 640 points every platform shows a count button and a grid of cards instead, which is what Safari and Chrome do on a phone.",
      },
    },
  },
  args: {
    tabs: OPEN,
    selected: OPEN[0]!.id,
    onSelect: () => {},
    label: 'Open files',
  },
  render: function Render(args) {
    // The tabs are the caller's: the component reports, the story decides.
    const [tabs, setTabs] = useState(args.tabs);
    const [selected, setSelected] = useState(args.selected);
    const [made, setMade] = useState(0);
    return (
      <View style={styles.frame}>
        <TabView
          {...args}
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          onClose={args.onClose && (id => {
            // Which tab opens next is the one thing every consumer of this
            // gets wrong, so the kit answers it rather than each caller.
            setSelected(current => nextSelection(tabs, id, current) ?? '');
            setTabs(current => current.filter(tab => tab.id !== id));
          })}
          onAdd={args.onAdd && (() => {
            const id = `new-${made + 1}`;
            setMade(made + 1);
            setTabs(current => [...current, {id, title: `Untitled ${made + 1}`}]);
            setSelected(id);
          })}>
          <Page tab={tabs.find(tab => tab.id === selected)}/>
        </TabView>
      </View>
    );
  },
} satisfies Meta<typeof TabView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The strip on its own: tabs that switch and nothing else, for a fixed set of documents. */
export const Plain: Story = {args: {layout: 'strip'}};

/** The whole control — closing, adding, and a pinned tab that stays. */
export const Editable: Story = {
  args: {
    layout: 'strip',
    onClose: () => {},
    onAdd: () => {},
    tabs: [{id: 'home', title: 'Home', pinned: true, icon: {symbol: {ios: 'house', android: 'home', web: 'home'}}}, ...OPEN],
  },
};

/**
 * What every platform falls back to under 640 points, and what a phone always
 * shows: the open document's name with the count beside it, over a grid of
 * cards. The cards are a title, an icon and a cross rather than the live
 * previews a browser draws — snapshotting arbitrary React Native content needs
 * a dependency the kit does not have, and for an app's own documents a name is
 * what you would want anyway.
 */
export const Switcher: Story = {args: {layout: 'switcher', onClose: () => {}, onAdd: () => {}}};

/** Left to measure for itself, which is how it is meant to be used: the strip above 640 points, the switcher below. */
export const Adaptive: Story = {args: {onClose: () => {}, onAdd: () => {}}};

const styles = StyleSheet.create({
  frame: {
    height: 260,
    alignSelf: 'stretch',
  },
  page: {
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.two,
    padding: spacing.four,
  },
});
