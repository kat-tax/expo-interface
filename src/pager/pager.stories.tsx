import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Body, Title2} from '../typography';
import {spacing, useColor} from '../theme';
import {Pager} from '.';

const PAGES = [
  {title: 'Drop a file', body: 'Anything you put here is shared with a link, and nothing else.'},
  {title: 'Set how long', body: 'A drop can last an hour, a day, or until you take it down.'},
  {title: 'Send the link', body: 'Whoever has it can open the drop. Nobody else can.'},
];

/** A page, sized so the pager has something to snap between. */
function Page({title, body}: {title: string; body: string}) {
  const background = useColor('backgroundElement');
  return (
    <View style={[styles.page, {backgroundColor: background}]}>
      <Title2>{title}</Title2>
      <Body>{body}</Body>
    </View>
  );
}

const meta = {
  title: 'Navigation/Pager',
  component: Pager,
  parameters: {
    docs: {
      description: {
        component:
          "Full-width pages that snap one at a time. The scroller is the platform's own on all four — `UIScrollView` paging, a snapping `ReactScrollView`, react-native-windows' composition snap points, and CSS scroll snap — so there is no hosted content anywhere. Windows draws a real WinUI `PipsPager` for the indicator, which is the one part of a pager that has no children to host; on web the pages are tab panels, inert while off screen, so the keyboard cannot land on a page nobody can see.",
      },
    },
  },
  args: {
    page: 0,
    onPageChange: () => {},
    label: 'Getting started',
    children: PAGES.map(item => <Page key={item.title} {...item}/>),
  },
  render: function Render(args) {
    // The pager is controlled, so the story owns the page it is on.
    const [page, setPage] = useState(0);
    return (
      <View style={styles.frame}>
        <Pager {...args} page={page} onPageChange={setPage}/>
      </View>
    );
  },
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

/** Without the dots, the swipe is the only way through — a gallery inside a screen that has its own chrome. */
export const WithoutIndicator: Story = {args: {indicator: false}};

const styles = StyleSheet.create({
  frame: {
    height: 220,
    width: '100%',
    maxWidth: 420,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.two,
    padding: spacing.four,
  },
});
