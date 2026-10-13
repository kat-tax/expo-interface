import {createElement} from 'react';
import {Dimensions, Platform, StyleSheet, Text, View} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {colors, variants} from '../theme';
import {TabView} from '.';

// `SymbolView` as a host view carrying its props, so a test reads the size
// and the colour the kit hands a glyph: Android's draws nothing of its own
// until its font has loaded.
vi.mock('expo-symbols', () => ({SymbolView: (props: object) => createElement('SymbolView', props)}));

const TABS = [
  {id: 'a', title: 'Notes', icon: {symbol: {ios: 'doc', android: 'description', web: 'description'}}} as const,
  {id: 'b', title: 'Sketch'},
  {id: 'c', title: 'Readme', pinned: true},
];

type Host = ReturnType<typeof screen.getByTestId>;

/** The glyphs drawn inside an element, in order, as the props `SymbolView` was handed. */
function glyphs(element: Host): {size: number; tintColor: string}[] {
  return element.children.flatMap(child => {
    if (typeof child === 'string') return [];
    return child.type === 'SymbolView' ? [child.props as {size: number; tintColor: string}] : glyphs(child);
  });
}

/** A text's own style, flattened. */
const textStyle = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

/** The width the root reports, which is what decides the shape. */
async function layout(width: number) {
  const handler = screen.getByTestId('t').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 400}}}));
}

describe(`TabView (${Platform.OS})`, () => {
  it('draws a tab for each, marks the open one, and shows its page', async () => {
    await render(
      <TabView tabs={TABS} selected="b" onSelect={() => {}} layout="strip" label="Files" testID="t">
        <Text>Page of B</Text>
      </TabView>,
    );
    expect(screen.getByText('Notes')).toBeOnTheScreen();
    expect(screen.getByText('Page of B')).toBeOnTheScreen();
    expect(screen.getByTestId('t-tab-b').props.accessibilityState).toMatchObject({selected: true});
    expect(screen.getByTestId('t-tab-a').props.accessibilityState).toMatchObject({selected: false});
    expect(screen.getByLabelText('Files')).toBeOnTheScreen();
  });

  it('takes a press on a tab as a request for it', async () => {
    const onSelect = vi.fn();
    await render(
      <TabView tabs={TABS} selected="a" onSelect={onSelect} layout="strip" testID="t"/>,
    );
    await fireEvent.press(screen.getByTestId('t-tab-b'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('shows a cross on every tab that closes, and none on a pinned one', async () => {
    const onClose = vi.fn();
    await render(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} layout="strip" testID="t"/>,
    );
    expect(screen.getByLabelText('Close Notes')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Close Readme')).toBeNull();
    await fireEvent.press(screen.getByTestId('t-close-a'));
    expect(onClose).toHaveBeenCalledWith('a');
  });

  it('shows no crosses at all when nothing can be closed', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(screen.queryByLabelText('Close Notes')).toBeNull();
  });

  it('adds a tab from the end of the strip, and shows no button without a handler', async () => {
    const onAdd = vi.fn();
    const {rerender} = await render(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>,
    );
    expect(screen.queryByLabelText('New tab')).toBeNull();
    await rerender(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={onAdd} layout="strip" testID="t"/>,
    );
    await fireEvent.press(screen.getByLabelText('New tab'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('puts the add button after the last tab: the scroller is as wide as its tabs, and shrinks to the room once they fill the row', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} layout="strip" testID="t"/>);
    // A ScrollView grows by default, which would take the row and push the
    // button to its far end.
    expect(StyleSheet.flatten(screen.getByTestId('t-strip').props.style)).toMatchObject({flexGrow: 0, flexShrink: 1});
    const row = screen.getByTestId('t-strip').parent!;
    expect(row.children.indexOf(screen.getByTestId('t-add'))).toBe(row.children.indexOf(screen.getByTestId('t-strip')) + 1);
  });

  describe('switcher', () => {
    it('names the open tab and the count, and hides the tabs until it is opened', async () => {
      await render(
        <TabView tabs={TABS} selected="b" onSelect={() => {}} layout="switcher" testID="t">
          <Text>Page of B</Text>
        </TabView>,
      );
      expect(screen.getByLabelText('Sketch, 3 tabs')).toBeOnTheScreen();
      expect(screen.getByText('Page of B')).toBeOnTheScreen();
      expect(screen.queryByTestId('t-cards')).toBeNull();
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(screen.getByTestId('t-cards')).toBeOnTheScreen();
      // The grid takes the content's place rather than floating over it.
      expect(screen.queryByText('Page of B')).toBeNull();
      expect(screen.getByTestId('t-switcher').props.accessibilityState).toMatchObject({expanded: true});
    });

    it('falls back to the label when no tab is open', async () => {
      await render(
        <TabView tabs={TABS} selected="gone" onSelect={() => {}} layout="switcher" label="Files" testID="t"/>,
      );
      expect(screen.getByLabelText('3 tabs')).toBeOnTheScreen();
    });

    it('selects from a card and puts the grid away', async () => {
      const onSelect = vi.fn();
      await render(
        <TabView tabs={TABS} selected="a" onSelect={onSelect} onClose={() => {}} layout="switcher" testID="t"/>,
      );
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(screen.getByTestId('t-card-a').props.accessibilityState).toMatchObject({selected: true});
      await fireEvent.press(screen.getByTestId('t-card-b'));
      expect(onSelect).toHaveBeenCalledWith('b');
      expect(screen.queryByTestId('t-cards')).toBeNull();
    });

    it('names a card by its tab\'s label', async () => {
      const tabs = [TABS[0], {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <View/>}];
      await render(<TabView tabs={tabs} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(screen.getByTestId('t-card-b').props.accessibilityLabel).toBe('Sketch, edited');
      expect(screen.getByTestId('t-card-a').props.accessibilityLabel).toBe('Notes');
    });

    it('closes a card in place, leaving the grid open', async () => {
      const onClose = vi.fn();
      await render(
        <TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} layout="switcher" testID="t"/>,
      );
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(screen.queryByLabelText('Close Readme')).toBeNull();
      await fireEvent.press(screen.getByTestId('t-close-b'));
      expect(onClose).toHaveBeenCalledWith('b');
      expect(screen.getByTestId('t-cards')).toBeOnTheScreen();
    });

    it('puts the grid away when a tab is added, since the new one is now open', async () => {
      const onAdd = vi.fn();
      await render(
        <TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={onAdd} layout="switcher" testID="t"/>,
      );
      await fireEvent.press(screen.getByTestId('t-switcher'));
      await fireEvent.press(screen.getByTestId('t-add'));
      expect(onAdd).toHaveBeenCalled();
      expect(screen.queryByTestId('t-cards')).toBeNull();
    });
  });

  it('measures the room it has rather than asking the window', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    await layout(1000);
    expect(screen.getByTestId('t-strip')).toBeOnTheScreen();
    // A pane opening beside the tabs narrows them without the window moving.
    await layout(480);
    expect(screen.queryByTestId('t-strip')).toBeNull();
    expect(screen.getByTestId('t-switcher')).toBeOnTheScreen();
  });

  it('calls the add button what it is asked to, in the strip and the switcher', async () => {
    const {rerender} = await render(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} addLabel="New document" layout="strip" testID="t"/>,
    );
    expect(screen.getByTestId('t-add').props.accessibilityLabel).toBe('New document');
    await rerender(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} addLabel="New document" layout="switcher" testID="t"/>,
    );
    expect(screen.getByTestId('t-add').props.accessibilityLabel).toBe('New document');
    expect(screen.queryByLabelText('New tab')).toBeNull();
  });

  it('names a tab by its label where the accessory says more, and by its title otherwise', async () => {
    const tabs = [TABS[0], {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <View/>}];
    await render(<TabView tabs={tabs} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(screen.getByTestId('t-tab-b').props.accessibilityLabel).toBe('Sketch, edited');
    expect(screen.getByTestId('t-tab-a').props.accessibilityLabel).toBe('Notes');
  });

  it('hides the accessory from assistive technology, in the strip and on the cards: the tab speaks for it', async () => {
    const tabs = [{id: 'a', title: 'Notes'}, {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <View testID="mark"/>}];
    /**
     * The wrapper over the accessory, which hides it as the testing library
     * models assistive technology: the accessory is found only when hidden
     * elements are asked for.
     */
    const wrapper = () => {
      expect(screen.queryByTestId('mark')).toBeNull();
      return screen.getByTestId('mark', {includeHiddenElements: true}).parent!;
    };
    /**
     * How many wrappers the tree holds: one per accessory, none for a tab
     * without. The scroll view's ref is a host instance, which a JSON of the
     * tree cannot hold, so it is left out.
     */
    const wrappers = () => JSON.stringify(screen.toJSON(), (key, value) => (key === 'scrollViewRef' ? undefined : value)).split('no-hide-descendants').length - 1;
    const {rerender} = await render(<TabView tabs={tabs} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    // On Android an accessible view inside the tab (a Badge) would be a stop of its own.
    expect(wrapper().props).toMatchObject({importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true});
    expect(wrapper().parent!.props.testID).toBe('t-tab-b');
    // Nothing to hide, nothing to wrap.
    expect(wrappers()).toBe(1);
    await rerender(<TabView tabs={tabs} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
    await fireEvent.press(screen.getByTestId('t-switcher'));
    expect(wrapper().props).toMatchObject({importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true});
    expect(wrapper().parent!.props.testID).toBe('t-card-b');
    // At its own size: the card's column would stretch it across the card.
    expect(StyleSheet.flatten(wrapper().props.style)).toMatchObject({alignItems: 'flex-start'});
    expect(wrappers()).toBe(1);
  });

  describe('fill', () => {
    const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).parent!.props.style);

    it('paints the strip in the raised fill, with the open tab in the page\'s colour', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
      expect(style('t-strip').backgroundColor).toBe(colors.light.backgroundElement);
      expect(style('t-tab-a').backgroundColor).toBe(colors.light.background);
      expect(style('t-tab-a').borderRadius).toBeUndefined();
      expect(style('t-tab-b').backgroundColor).toBeUndefined();
    });

    it('draws no fill of its own with none, and marks the open tab with a pill', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" fill="none" testID="t"/>);
      expect(style('t-strip').backgroundColor).toBeUndefined();
      expect(style('t-tab-a')).toMatchObject({backgroundColor: colors.light.pillBackground, borderRadius: 8});
      expect(style('t-tab-b').backgroundColor).toBeUndefined();
      expect(style('t-tab-b').borderRadius).toBeUndefined();
    });

    it('draws no fill of its own with accent either, and marks the open tab with a capsule in the tint, its title, icon and cross in onTint', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} layout="strip" fill="accent" testID="t"/>);
      expect(style('t-strip').backgroundColor).toBeUndefined();
      expect(style('t-tab-a')).toMatchObject({backgroundColor: colors.light.tint, borderRadius: 999});
      expect(textStyle('Notes').color).toBe(colors.light.onTint);
      expect(glyphs(screen.getByTestId('t-tab-a')).map(glyph => glyph.tintColor)).toEqual([colors.light.onTint]);
      expect(glyphs(screen.getByTestId('t-close-a')).map(glyph => glyph.tintColor)).toEqual([colors.light.onTint]);
      // A tab that is not open is a text button in the label tone: no fill, the label's colour.
      expect(style('t-tab-b').backgroundColor).toBeUndefined();
      expect(style('t-tab-b').borderRadius).toBeUndefined();
      expect(textStyle('Sketch').color).toBe(colors.light.label);
      expect(glyphs(screen.getByTestId('t-close-b')).map(glyph => glyph.tintColor)).toEqual([colors.light.label]);
    });

    it('draws the accent tabs as the platform buttons: their padding a side, the open one as wide, in a row 8 apart inset 16', async () => {
      const strip = (size?: 'small') => <TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} layout="strip" fill="accent" size={size} testID="t"/>;
      const {rerender} = await render(strip('small'));
      const android = Platform.OS === 'android';
      // The plus keeps the row's 16 from the edge: its 7 a side and 9 more.
      expect(StyleSheet.flatten(screen.getByTestId('t-add').props.style)).toMatchObject({paddingHorizontal: 7, marginRight: 9});
      // Material on Android: the small button's 16 a side and at least its 40 tall, medium; 12 and semibold on iOS.
      for (const id of ['t-tab-a', 't-tab-b']) {
        expect(style(id)).toMatchObject({paddingLeft: android ? 16 : 12, paddingRight: android ? 16 : 12});
        expect(style(id).minHeight).toBe(android ? 40 : undefined);
      }
      expect(textStyle('Notes').fontWeight).toBe(android ? '500' : '600');
      expect(textStyle('Sketch').fontWeight).toBe(android ? '500' : '600');
      expect(glyphs(screen.getByTestId('t-tab-a')).map(glyph => glyph.tintColor)).toEqual([colors.light.onTint]);
      expect(StyleSheet.flatten(screen.getByTestId('t-strip').props.contentContainerStyle)).toMatchObject({alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8});
      // The medium button at the regular size: Material's 24, or 18.
      await rerender(strip());
      expect(style('t-tab-b')).toMatchObject({paddingLeft: android ? 24 : 18, paddingRight: android ? 24 : 18});
      expect(StyleSheet.flatten(screen.getByTestId('t-add').props.style)).toMatchObject({paddingHorizontal: 16, marginRight: 0});
      // Without the accent the row keeps the strip's own.
      await rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" fill="none" testID="t"/>);
      expect(StyleSheet.flatten(screen.getByTestId('t-strip').props.contentContainerStyle).gap).toBeUndefined();
      expect(textStyle('Sketch').color).toBe(colors.light.secondaryLabel);
      expect(textStyle('Sketch').fontWeight).toBe('400');
    });

    it('paints the switcher\'s bar, or leaves it bare with none and with accent', async () => {
      const {rerender} = await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
      expect(style('t-switcher').backgroundColor).toBe(colors.light.backgroundElement);
      await rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" fill="none" testID="t"/>);
      expect(style('t-switcher').backgroundColor).toBeUndefined();
      // The bar names the open tab rather than drawing it: no capsule to mark.
      await rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" fill="accent" testID="t"/>);
      expect(style('t-switcher').backgroundColor).toBeUndefined();
    });
  });

  describe('size', () => {
    const own = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

    it('draws the strip at the small button\'s metrics with small: the footnote with 6 above and below, the icon 14 and the cross 12', async () => {
      const strip = (size?: 'small') => <TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} layout="strip" size={size} testID="t"/>;
      const {rerender} = await render(strip());
      expect(own('t-tab-a').paddingVertical).toBe(16);
      expect(textStyle('Notes')).toMatchObject({fontSize: variants.body.fontSize, lineHeight: variants.body.lineHeight});
      expect(glyphs(screen.getByTestId('t-tab-a'))[0]!.size).toBe(16);
      expect(glyphs(screen.getByTestId('t-close-a'))[0]!.size).toBe(14);
      await rerender(strip('small'));
      expect(own('t-tab-a').paddingVertical).toBe(6);
      expect(textStyle('Notes')).toMatchObject({fontSize: 13, lineHeight: 18});
      expect(textStyle('Sketch')).toMatchObject({fontSize: 13, lineHeight: 18});
      expect(glyphs(screen.getByTestId('t-tab-a'))[0]!.size).toBe(14);
      expect(glyphs(screen.getByTestId('t-close-a'))[0]!.size).toBe(12);
      // The plus keeps the small circle button's 16, in a square as tall as the strip.
      expect(glyphs(screen.getByTestId('t-add'))[0]!.size).toBe(16);
      expect(own('t-add').paddingHorizontal).toBe(7);
    });

    it('draws the switcher\'s bar small too, and the cards at their own size', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} layout="switcher" size="small" testID="t"/>);
      expect(own('t-switcher').paddingVertical).toBe(6);
      expect(textStyle('Notes')).toMatchObject({fontSize: 13, lineHeight: 18});
      expect(glyphs(screen.getByTestId('t-switcher'))[0]!.size).toBe(14);
      expect(StyleSheet.flatten(screen.getByText('3').parent!.props.style).minWidth).toBe(20);
      expect(own('t-add').paddingHorizontal).toBe(7);
      await fireEvent.press(screen.getByTestId('t-switcher'));
      // A grid is not a bar.
      expect(glyphs(screen.getByTestId('t-card-a'))[0]!.size).toBe(16);
      expect(glyphs(screen.getByTestId('t-close-a'))[0]!.size).toBe(14);
      expect(textStyle('Sketch')).toMatchObject({fontSize: variants.body.fontSize, lineHeight: variants.body.lineHeight});
    });
  });

  describe('without children', () => {
    const root = () => screen.getByTestId('t');
    const grow = () => StyleSheet.flatten(root().props.style).flexGrow;

    it('is the strip alone: no growth and no page under it', async () => {
      const {rerender} = await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
      expect(grow()).toBe(0);
      expect(root().children).toHaveLength(1);
      await rerender(
        <TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t">
          <Text>Page of A</Text>
        </TabView>,
      );
      expect(grow()).toBe(1);
      expect(root().children).toHaveLength(2);
    });

    it('keeps the page for null, which is a page with nothing in it', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t">{null}</TabView>);
      expect(grow()).toBe(1);
      expect(root().children).toHaveLength(2);
    });

    it('keeps the page for children that come out undefined, as when the last document closes', async () => {
      const open = TABS.find(tab => tab.id === 'gone');
      await render(
        <TabView tabs={TABS} selected="gone" onSelect={() => {}} layout="strip" testID="t">
          {open && <Text>{open.title}</Text>}
        </TabView>,
      );
      expect(grow()).toBe(1);
      expect(root().children).toHaveLength(2);
    });

    it('is the switcher\'s bar alone, with nothing under it until the cards open', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
      expect(grow()).toBe(0);
      expect(root().children).toHaveLength(1);
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(screen.getByTestId('t-cards')).toBeOnTheScreen();
    });

    it('opens the cards at most half the window tall, where no page bounds them, and scrolls past that', async () => {
      const cards = () => StyleSheet.flatten(screen.getByTestId('t-cards').props.style) ?? {};
      const {rerender} = await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
      await fireEvent.press(screen.getByTestId('t-switcher'));
      expect(cards().maxHeight).toBe(Dimensions.get('window').height / 2);
      // With a page, the cards take its place and are as tall as it is.
      await rerender(
        <TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t">
          <Text>Page of A</Text>
        </TabView>,
      );
      expect(cards().maxHeight).toBeUndefined();
    });

    it('takes content for what it says, as a wrapper that always passes children on needs', async () => {
      const {rerender} = await render(
        <TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" content={false} testID="t">
          {undefined}
        </TabView>,
      );
      expect(grow()).toBe(0);
      expect(root().children).toHaveLength(1);
      await rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" content testID="t"/>);
      expect(grow()).toBe(1);
      expect(root().children).toHaveLength(2);
    });

    it('lets a caller\'s style grow it all the same', async () => {
      await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" style={{flexGrow: 1}} testID="t"/>);
      expect(grow()).toBe(1);
    });
  });

  it('needs no testID to draw', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} layout="strip"/>);
    expect(screen.getByText('Notes')).toBeOnTheScreen();
  });
});
