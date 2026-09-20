// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TabView} from '.';

const TABS = [
  {id: 'a', title: 'Notes', icon: {symbol: {ios: 'doc', android: 'description', web: 'description'}}} as const,
  {id: 'b', title: 'Sketch'},
  {id: 'c', title: 'Readme', pinned: true},
];

/**
 * jsdom lays nothing out, so a container reports no width and the component
 * falls back to the window — which is what this sets. A real page is measured
 * with a `ResizeObserver`, which jsdom does not implement either.
 */
function windowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {value: width, configurable: true, writable: true});
}

beforeEach(() => {
  windowWidth(1024);
});

describe('TabView (web)', () => {
  it('is a tab list over a tab panel, with the open tab marked and naming the panel', () => {
    render(
      <TabView tabs={TABS} selected="b" onSelect={() => {}} label="Files" testID="t">
        <p>Page of B</p>
      </TabView>,
    );
    const list = screen.getByRole('tablist');
    expect(list).toHaveAccessibleName('Files');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Page of B');
    // The panel is named by the tab that opened it, which is what makes the
    // roles true rather than decorative.
    // Named by the tab's title, not by the tab: an aria-labelledby target is
    // read whole, and the icon beside the title is a ligature — the glyph's
    // own name as text — so the tab would have named the panel
    // "descriptionSketch".
    expect(panel).toHaveAccessibleName('Sketch');
    expect(tabs[1]).toHaveAttribute('aria-controls', panel.id);
  });

  it('leaves the panel unnamed when no tab is open', () => {
    render(<TabView tabs={TABS} selected="gone" onSelect={() => {}}><p>Nothing</p></TabView>);
    expect(screen.getByRole('tabpanel')).not.toHaveAccessibleName();
  });

  it('holds one tab stop, on the open tab, and selects as the arrows move', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(tabs[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveFocus();
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('takes a click on a tab as a request for it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
    await user.click(screen.getByTestId('t-tab-b'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('closes from the cross without selecting the tab that is going away', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<TabView tabs={TABS} selected="a" onSelect={onSelect} onClose={onClose} testID="t"/>);
    const cross = screen.getByTestId('t-close-b');
    // A pointer affordance rather than a control: inside `role="tab"` a button
    // is never exposed, and beside it `tablist` does not allow one. Which is
    // why the tab says how the keyboard does it instead.
    expect(cross).toHaveAttribute('aria-hidden', 'true');
    expect(cross).toHaveAttribute('title', 'Close Sketch');
    expect(screen.getByTestId('t-tab-b')).toHaveAttribute('aria-keyshortcuts', 'Delete');
    await user.click(cross);
    expect(onClose).toHaveBeenCalledWith('b');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('gives a pinned tab no cross and no shortcut, and gives neither at all without a handler', () => {
    const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} testID="t"/>);
    expect(screen.queryByTestId('t-close-c')).toBeNull();
    expect(screen.getByTestId('t-tab-c')).not.toHaveAttribute('aria-keyshortcuts');
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    expect(screen.queryByTestId('t-close-a')).toBeNull();
    expect(screen.getByTestId('t-tab-a')).not.toHaveAttribute('aria-keyshortcuts');
  });

  it('closes the focused tab with Delete, which is the convention a strip teaches', () => {
    const onClose = vi.fn();
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} testID="t"/>);
    fireEvent.keyDown(screen.getByTestId('t-tab-b'), {key: 'Delete'});
    expect(onClose).toHaveBeenCalledWith('b');
  });

  it('leaves Delete alone on a pinned tab, on a strip that does not close, and for other keys', () => {
    const onClose = vi.fn();
    const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} testID="t"/>);
    fireEvent.keyDown(screen.getByTestId('t-tab-c'), {key: 'Delete'});
    fireEvent.keyDown(screen.getByTestId('t-tab-b'), {key: 'Backspace'});
    expect(onClose).not.toHaveBeenCalled();
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    fireEvent.keyDown(screen.getByTestId('t-tab-b'), {key: 'Delete'});
    expect(onClose).not.toHaveBeenCalled();
  });

  it('adds a tab from the end of the strip, and shows no button without a handler', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}}/>);
    expect(screen.queryByRole('button', {name: 'New tab'})).toBeNull();
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={onAdd}/>);
    await user.click(screen.getByRole('button', {name: 'New tab'}));
    expect(onAdd).toHaveBeenCalled();
  });

  describe('switcher', () => {
    it('replaces the strip with a disclosure under the breakpoint', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(
        <TabView tabs={TABS} selected="b" onSelect={() => {}} testID="t">
          <p>Page of B</p>
        </TabView>,
      );
      expect(screen.queryByTestId('t-strip')).toBeNull();
      const button = screen.getByRole('button', {name: 'Sketch, 3 tabs'});
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Page of B');
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      // The grid is a tab list too, so the tabs are the same thing to a screen
      // reader at either size.
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.queryByRole('tabpanel')).toBeNull();
    });

    it('names itself after the group when no tab is open', () => {
      windowWidth(480);
      render(<TabView tabs={TABS} selected="gone" onSelect={() => {}} label="Files"/>);
      expect(screen.getByRole('button', {name: '3 tabs'})).toHaveTextContent('Files');
    });

    it('selects from a card and puts the grid away', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} onClose={() => {}} testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      fireEvent.keyDown(screen.getByTestId('t-card-b'), {key: 'Delete'});
      await user.click(screen.getByTestId('t-card-b'));
      expect(onSelect).toHaveBeenCalledWith('b');
      expect(screen.queryByTestId('t-cards')).toBeNull();
    });

    it('gives a card the same Delete, and leaves other keys alone', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      fireEvent.keyDown(screen.getByTestId('t-card-b'), {key: 'Backspace'});
      fireEvent.keyDown(screen.getByTestId('t-card-c'), {key: 'Delete'});
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByTestId('t-card-b'), {key: 'Delete'});
      expect(onClose).toHaveBeenCalledWith('b');
    });

    it('needs no testID to open', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} label="Files"/>);
      await user.click(screen.getByRole('button', {name: 'Notes, 3 tabs'}));
      expect(screen.getByRole('tablist')).toHaveAccessibleName('Files');
    });

    it('puts the grid away when a tab is added, since the new one is now open', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      await user.click(screen.getByRole('button', {name: 'New tab'}));
      expect(screen.queryByTestId('t-cards')).toBeNull();
    });
  });

  it('measures the room it has once there is a ResizeObserver to measure with', () => {
    const observers: ((entries: {contentRect: {width: number}}[]) => void)[] = [];
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: (entries: {contentRect: {width: number}}[]) => void) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
    });
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    expect(screen.getByTestId('t-strip')).toBeInTheDocument();
    // A sidebar opening beside the tabs narrows them without the window moving.
    act(() => observers.forEach(report => report([{contentRect: {width: 400}}])));
    expect(screen.queryByTestId('t-strip')).toBeNull();
    expect(screen.getByTestId('t-switcher')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('takes a style, and needs no testID', () => {
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} style={{opacity: 0.5}}/>);
    expect(screen.getByRole('tablist').parentElement?.parentElement).toHaveStyle({opacity: 0.5});
  });
});
