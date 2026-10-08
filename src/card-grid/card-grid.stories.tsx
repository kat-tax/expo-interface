import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Caption, Footnote, Headline} from '../typography';
import {Card} from '../card';
import {EmptyState} from '../empty-state';
import * as icons from '../__stories__/icons';
import {CardGrid} from '.';

interface Document {
  id: string;
  title: string;
  edited: string;
}

/** Two hundred documents, which cost what the screen shows. */
const DOCUMENTS: Document[] = Array.from({length: 200}, (_, index) => ({
  id: `d${index + 1}`,
  title: index === 0 ? 'Holiday photos' : `Document ${index + 1}`,
  edited: index === 0 ? 'Edited just now' : `Edited ${index} ${index === 1 ? 'day' : 'days'} ago`,
}));

/** One cell: a card with a preview and a footer, the width of its cell. */
function DocumentCard({document}: {document: Document}) {
  return (
    <Card
      label={document.title}
      onPress={() => {}}
      footer={
        <View>
          <Headline color="label">{document.title}</Headline>
          <Caption color="secondaryLabel">{document.edited}</Caption>
        </View>
      }>
      <View style={styles.preview}>
        <Footnote color="tertiaryLabel">Preview</Footnote>
      </View>
    </Card>
  );
}

const meta = {
  title: 'Layout/CardGrid',
  component: CardGrid,
  parameters: {
    native: false,
    docs: {
      description: {
        component:
          'A grid of cards that grows. The columns come from the width: as many cards of at least `minItemWidth` as fit, up to `maxColumns`, so a phone holds two and a desk four. The cells are drawn only as they come into view: a windowed `FlatList` of rows natively, a windowed CSS grid on web.',
      },
    },
  },
  args: {
    data: DOCUMENTS,
    keyExtractor: document => document.id,
    renderItem: document => <DocumentCard document={document}/>,
    minItemWidth: 150,
    maxColumns: 4,
    gap: 12,
  },
  render: args => (
    <View style={styles.frame}>
      <CardGrid {...args}/>
    </View>
  ),
} satisfies Meta<typeof CardGrid<Document>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two hundred cards, in as many columns as the width holds. */
export const Basic: Story = {};

/** Wider cells and no more than two columns, for cards that carry a wide preview. */
export const TwoColumns: Story = {args: {minItemWidth: 200, maxColumns: 2, gap: 16}};

/** Content before the first row of cells and after the last. */
export const HeaderAndFooter: Story = {
  args: {
    data: DOCUMENTS.slice(0, 7),
    header: <Headline color="label">Recent</Headline>,
    footer: <Footnote color="secondaryLabel">7 of 200 documents</Footnote>,
  },
};

/** What the grid shows in place of its cells when there are none. */
export const Empty: Story = {
  args: {
    data: [],
    empty: <EmptyState icon={icons.info} title="No documents yet" description="Anything you create shows up here."/>,
  },
};

/** A grid that loads more: `onEndReached` fires once the last cells have been drawn. */
export const LoadsMore: Story = {
  render: function Render(args) {
    const [count, setCount] = useState(24);
    return (
      <View style={styles.frame}>
        <CardGrid
          {...args}
          data={DOCUMENTS.slice(0, count)}
          onEndReached={() => setCount(current => Math.min(current + 24, DOCUMENTS.length))}
          footer={<Footnote color="secondaryLabel">{`${count} of ${DOCUMENTS.length}`}</Footnote>}
        />
      </View>
    );
  },
};

const styles = StyleSheet.create({
  frame: {
    height: 480,
    alignSelf: 'stretch',
  },
  preview: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
