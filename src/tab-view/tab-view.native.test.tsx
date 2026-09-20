import {Platform, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {TabView} from '.';

const TABS = [
  {id: 'a', title: 'Notes', icon: {symbol: {ios: 'doc', android: 'description', web: 'description'}}} as const,
  {id: 'b', title: 'Sketch'},
  {id: 'c', title: 'Readme', pinned: true},
];

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

  it('needs no testID to draw', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} layout="strip"/>);
    expect(screen.getByText('Notes')).toBeOnTheScreen();
  });
});
