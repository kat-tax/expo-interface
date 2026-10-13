// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {ComponentProps} from 'react';
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

/**
 * `tab-view.css` reaches jsdom as nothing: for a test that reads the
 * cascade, the sheet goes into the page by hand, and jsdom applies its rules
 * to what is rendered. `getComputedStyle` then answers a rule's value as
 * written (`var(--color-tint)`).
 */
function stylesheet(): () => void {
  const sheet = document.createElement('style');
  sheet.textContent = readFileSync(path.join(__dirname, 'tab-view.css'), 'utf8');
  document.head.append(sheet);
  return () => sheet.remove();
}

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

  it('names a tab by its label, or by its title, and never by the accessory\'s text', () => {
    const tabs = [
      TABS[0],
      {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <span>edited</span>},
      {id: 'c', title: 'Inbox', accessory: <span>3</span>},
    ];
    render(<TabView tabs={tabs} selected="a" onSelect={() => {}} testID="t"/>);
    expect(screen.getByTestId('t-tab-a')).toHaveAccessibleName('Notes');
    expect(screen.getByTestId('t-tab-b')).toHaveAccessibleName('Sketch, edited');
    expect(screen.getByTestId('t-tab-c')).toHaveAccessibleName('Inbox');
  });

  it('hides the accessory from assistive technology: the tab speaks for it', async () => {
    const tabs = [{id: 'a', title: 'Notes'}, {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <em>edited</em>}];
    render(<TabView tabs={tabs} selected="a" onSelect={() => {}} testID="t"/>);
    const wrapper = screen.getByText('edited').parentElement!;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveClass('ui-tab-view__accessory');
    expect(screen.getByTestId('t-tab-b').contains(wrapper)).toBe(true);
    // Nothing to hide, nothing to wrap.
    expect(screen.getByTestId('t-tab-a').querySelector('[aria-hidden]')).toBeNull();
    // No box of its own, so what it holds lays out as it would unwrapped.
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const css = readFileSync(join(__dirname, 'tab-view.css'), 'utf8');
    expect(/\n\.ui-tab-view__accessory \{([^}]*)\}/.exec(css)![1]).toContain('display: contents;');
  });

  it('draws no panel and controls none without children: the tabs alone', () => {
    render(<TabView tabs={TABS} selected="b" onSelect={() => {}} testID="t"/>);
    expect(screen.queryByRole('tabpanel')).toBeNull();
    for (const tab of screen.getAllByRole('tab')) expect(tab).not.toHaveAttribute('aria-controls');
    expect(screen.getByTestId('t')).toHaveClass('ui-tab-view', 'ui-tab-view--alone');
  });

  it('grows into its parent, but not as the tabs alone, whose rule comes after the one that grows', async () => {
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const css = readFileSync(join(__dirname, 'tab-view.css'), 'utf8');
    const root = /\.ui-tab-view \{([^}]*)\}/.exec(css)!;
    const alone = /\.ui-tab-view--alone \{([^}]*)\}/.exec(css)!;
    expect(root[1]).toContain('flex: 1 1 auto;');
    expect(alone[1]).toContain('flex-grow: 0;');
    // The same specificity, so the later rule is the one that holds.
    expect(alone.index).toBeGreaterThan(root.index);
  });

  it('keeps the panel for null, which is a page with nothing in it', () => {
    render(<TabView tabs={TABS} selected="b" onSelect={() => {}} testID="t">{null}</TabView>);
    expect(screen.getByRole('tabpanel')).toBeEmptyDOMElement();
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--alone');
  });

  it('keeps the panel for children that come out undefined, as when the last document closes', () => {
    const open = TABS.find(tab => tab.id === 'gone');
    render(<TabView tabs={TABS} selected="gone" onSelect={() => {}} testID="t">{open && <p>{open.title}</p>}</TabView>);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toBeEmptyDOMElement();
    for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--alone');
  });

  it('is the tabs alone with content={false}, through a wrapper that always passes children on', () => {
    function DocTabs({children, ...rest}: ComponentProps<typeof TabView>) {
      return <TabView {...rest}>{children}</TabView>;
    }
    const {rerender} = render(<DocTabs tabs={TABS} selected="b" onSelect={() => {}} testID="t"/>);
    // The wrapper's element always has children, so without content it is a page.
    expect(screen.getByRole('tabpanel')).toBeEmptyDOMElement();
    rerender(<DocTabs tabs={TABS} selected="b" onSelect={() => {}} content={false} testID="t"><p>Ignored</p></DocTabs>);
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.queryByText('Ignored')).toBeNull();
    expect(screen.getByTestId('t')).toHaveClass('ui-tab-view--alone');
  });

  it('keeps a page with content, children or none', () => {
    render(<TabView tabs={TABS} selected="b" onSelect={() => {}} content testID="t"/>);
    expect(screen.getByRole('tabpanel')).toBeEmptyDOMElement();
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--alone');
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

  describe('activation', () => {
    it('moves the focus alone with manual, and selects with Enter or Space', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} activation="manual" testID="t"/>);
      const tabs = screen.getAllByRole('tab');
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(tabs[1]).toHaveFocus();
      expect(onSelect).not.toHaveBeenCalled();
      await user.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith('b');
      await user.keyboard('{ArrowRight}');
      expect(tabs[2]).toHaveFocus();
      expect(onSelect).toHaveBeenCalledTimes(1);
      await user.keyboard(' ');
      expect(onSelect).toHaveBeenLastCalledWith('c');
    });

    it('keeps Space from scrolling the page, and leaves other keys alone', () => {
      const onSelect = vi.fn();
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} activation="manual" testID="t"/>);
      const sketch = screen.getByTestId('t-tab-b');
      expect(fireEvent.keyDown(sketch, {key: ' '})).toBe(false);
      expect(fireEvent.keyDown(sketch, {key: 'Enter'})).toBe(false);
      expect(fireEvent.keyDown(sketch, {key: 'Backspace'})).toBe(true);
      expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it('selects with Enter or Space under automatic too, for a focused tab whose selection the app did not take', () => {
      const onSelect = vi.fn();
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} testID="t"/>);
      fireEvent.keyDown(screen.getByTestId('t-tab-b'), {key: 'Enter'});
      expect(onSelect).toHaveBeenCalledWith('b');
      fireEvent.keyDown(screen.getByTestId('t-tab-c'), {key: ' '});
      expect(onSelect).toHaveBeenLastCalledWith('c');
    });

    it('selects a card with Enter and puts the grid away', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={onSelect} activation="manual" testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      await user.keyboard('{ArrowRight}');
      expect(onSelect).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByTestId('t-card-b'), {key: 'Enter'});
      expect(onSelect).toHaveBeenCalledWith('b');
      expect(screen.queryByTestId('t-cards')).toBeNull();
    });
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

  it('puts the add button after the last tab: the strip is as wide as its tabs, and shrinks and scrolls once they fill the bar', () => {
    const remove = stylesheet();
    try {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} testID="t"/>);
      const strip = screen.getByTestId('t-strip');
      expect(strip.nextElementSibling).toBe(screen.getByTestId('t-add'));
      const style = getComputedStyle(strip);
      expect(style.flexGrow).toBe('0');
      expect(style.flexShrink).toBe('1');
      expect(style.minWidth).toBe('0px');
      expect(style.overflowX).toBe('auto');
    } finally {
      remove();
    }
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

  it('takes no fill of its own with none or accent, and the raised fill by default', () => {
    const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--no-fill');
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--accent');
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} fill="none" testID="t"/>);
    expect(screen.getByTestId('t')).toHaveClass('ui-tab-view--no-fill');
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--accent');
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} fill="accent" testID="t"/>);
    expect(screen.getByTestId('t')).toHaveClass('ui-tab-view--accent');
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--no-fill');
  });

  it('takes the small size\'s class with small, and none by default', () => {
    const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
    expect(screen.getByTestId('t')).not.toHaveClass('ui-tab-view--small');
    rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} size="small" testID="t"/>);
    expect(screen.getByTestId('t')).toHaveClass('ui-tab-view--small');
  });

  describe('with the stylesheet applied', () => {
    let remove: () => void;

    beforeEach(() => {
      remove = stylesheet();
    });

    afterEach(() => {
      remove();
    });

    // The fills are written with the `background` shorthand, which jsdom
    // answers as written there (`transparent` as `rgba(0, 0, 0, 0)`) and not
    // in `backgroundColor`.
    /** The shell a tab is drawn in, which carries its fill. */
    const shell = (testID: string) => screen.getByTestId(testID).parentElement!;
    const bar = () => screen.getByTestId('t-strip').parentElement!;
    /** The glyphs drawn in an element, in order. */
    const glyphs = (element: Element) => [...element.querySelectorAll<HTMLElement>('.ui-symbol')];

    it('paints the bar in the raised fill and the open tab in the page\'s colour by default', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      expect(getComputedStyle(bar()).background).toBe('var(--color-background-element)');
      expect(getComputedStyle(shell('t-tab-a')).background).toBe('var(--color-background)');
    });

    it('clears the bar with none and marks the open tab with a pill instead', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} fill="none" testID="t"/>);
      expect(getComputedStyle(bar()).background).toBe('rgba(0, 0, 0, 0)');
      const pill = getComputedStyle(shell('t-tab-a'));
      expect(pill.background).toBe('var(--color-pill-background)');
      expect(pill.borderRadius).toBe('8px');
    });

    it('clears the bar with accent too, and marks the open tab with a capsule in the tint, its title, icon and cross in onTint', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} fill="accent" testID="t"/>);
      expect(getComputedStyle(bar()).background).toBe('rgba(0, 0, 0, 0)');
      const capsule = getComputedStyle(shell('t-tab-a'));
      expect(capsule.background).toBe('var(--color-tint)');
      expect(capsule.color).toBe('var(--color-on-tint)');
      expect(capsule.borderRadius).toBe('999px');
      // The icon and the cross draw in the text's colour, which the capsule's rule sets.
      expect(glyphs(shell('t-tab-a')).map(glyph => glyph.style.color)).toEqual(['currentcolor', 'currentcolor']);
      // A tab that is not open keeps the strip's look.
      expect(getComputedStyle(shell('t-tab-b')).background).toBe('');
      expect(getComputedStyle(shell('t-tab-b')).color).toBe('var(--color-secondary-label)');
      expect(glyphs(shell('t-tab-b')).map(glyph => glyph.style.color)).toEqual(['var(--color-label)']);
    });

    it('draws the focus ring on the accent\'s capsule in onTint, where the tint would vanish', () => {
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} fill="accent" testID="t"/>);
      // The rule by its selector: jsdom's `:focus-visible` follows a guess at
      // how the focus came, so the ring is read from the sheet instead.
      const selector = ".ui-tab-view--accent .ui-tab-view__tab[data-selected='true'] .ui-tab-view__tab-body";
      const css = readFileSync(path.join(__dirname, 'tab-view.css'), 'utf8');
      const ring = css.indexOf(`\n${selector}:focus-visible {`);
      expect(ring).toBeGreaterThan(-1);
      expect(css.slice(ring, css.indexOf('}', ring))).toContain('outline-color: var(--color-on-tint);');
      // It names the open tab's body, and no other tab's.
      expect(screen.getByTestId('t-tab-a').matches(selector)).toBe(true);
      expect(screen.getByTestId('t-tab-b').matches(selector)).toBe(false);
    });

    it('draws the strip at the small button\'s metrics with small: 13 px on 18 with 6 above and below, the icon 14 and the cross 12', () => {
      const strip = (size?: 'small') => <TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} size={size} testID="t"/>;
      const {rerender} = render(strip());
      const title = () => getComputedStyle(screen.getByText('Notes'));
      expect(title().paddingTop).toBe('10px');
      rerender(strip('small'));
      expect(title().fontSize).toBe('13px');
      expect(title().lineHeight).toBe('18px');
      expect(title().paddingTop).toBe('6px');
      expect(title().paddingBottom).toBe('6px');
      expect(glyphs(shell('t-tab-a')).map(glyph => glyph.style.fontSize)).toEqual(['14px', '12px']);
      // The plus keeps the small circle button's 16, in a square as tall as the bar.
      expect(glyphs(screen.getByTestId('t-add')).map(glyph => glyph.style.fontSize)).toEqual(['16px']);
      expect(getComputedStyle(screen.getByTestId('t-add')).paddingLeft).toBe('7px');
    });

    it('draws the switcher\'s bar small too, and the cards at their own size', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={() => {}} size="small" testID="t"/>);
      const switcher = screen.getByTestId('t-switcher');
      const title = getComputedStyle(switcher.querySelector('.ui-tab-view__title')!);
      expect(title.fontSize).toBe('13px');
      expect(title.paddingTop).toBe('6px');
      expect(glyphs(switcher).map(glyph => glyph.style.fontSize)).toEqual(['14px']);
      expect(getComputedStyle(switcher.querySelector('.ui-tab-view__count')!).minWidth).toBe('20px');
      await user.click(switcher);
      // A grid is not a bar.
      expect(glyphs(screen.getByTestId('t-card-a').parentElement!).map(glyph => glyph.style.fontSize)).toEqual(['16px', '14px']);
      expect(getComputedStyle(screen.getByTestId('t-card-a').parentElement!).fontSize).toBe('15px');
    });
  });

  it('calls the add button what it is asked to', () => {
    render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} addLabel="New document"/>);
    expect(screen.getByRole('button', {name: 'New document'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'New tab'})).toBeNull();
  });

  describe('switcher', () => {
    it('calls the add button what it is asked to there too', () => {
      windowWidth(480);
      render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={() => {}} addLabel="New document"/>);
      expect(screen.getByRole('button', {name: 'New document'})).toBeInTheDocument();
    });

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

    it('is the bar alone without children, and its cards control no panel', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="b" onSelect={() => {}} testID="t"/>);
      expect(screen.queryByRole('tabpanel')).toBeNull();
      await user.click(screen.getByTestId('t-switcher'));
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      for (const tab of screen.getAllByRole('tab')) expect(tab).not.toHaveAttribute('aria-controls');
      await user.click(screen.getByTestId('t-card-a'));
      expect(screen.queryByRole('tabpanel')).toBeNull();
    });

    it('opens the cards of the tabs alone at most half the window tall, and scrolls them past that', async () => {
      const {readFileSync} = await import('node:fs');
      const {join} = await import('node:path');
      const css = readFileSync(join(__dirname, 'tab-view.css'), 'utf8');
      expect(/\n\.ui-tab-view__cards \{([^}]*)\}/.exec(css)![1]).toContain('overflow-y: auto;');
      expect(/\n\.ui-tab-view--alone \.ui-tab-view__cards \{([^}]*)\}/.exec(css)![1]).toContain('max-height: 50vh;');
    });

    it('names a card as the strip names its tab', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      const tabs = [TABS[0], {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <span>edited</span>}];
      render(<TabView tabs={tabs} selected="a" onSelect={() => {}} testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      expect(screen.getByTestId('t-card-a')).toHaveAccessibleName('Notes');
      expect(screen.getByTestId('t-card-b')).toHaveAccessibleName('Sketch, edited');
    });

    it('hides a card\'s accessory as the strip hides a tab\'s', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      const tabs = [{id: 'a', title: 'Notes'}, {id: 'b', title: 'Sketch', label: 'Sketch, edited', accessory: <em>edited</em>}];
      render(<TabView tabs={tabs} selected="a" onSelect={() => {}} testID="t"/>);
      await user.click(screen.getByTestId('t-switcher'));
      const wrapper = screen.getByText('edited').parentElement!;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      expect(wrapper).toHaveClass('ui-tab-view__accessory');
      expect(screen.getByTestId('t-card-b').contains(wrapper)).toBe(true);
      expect(screen.getByTestId('t-card-a').querySelector('[aria-hidden]')).toBeNull();
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

  describe('the selected tab in view', () => {
    // jsdom lays nothing out and has no `scrollIntoView`; the stub records
    // which element was asked, and how.
    const scrollIntoView = vi.fn();

    beforeEach(() => {
      Element.prototype.scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
      delete (Element.prototype as {scrollIntoView?: unknown}).scrollIntoView;
    });

    /**
     * The shell a tab or a card is drawn in: the element around the
     * `role="tab"` body that carries `data-selected` and draws the padding,
     * the pill or the card's border.
     */
    const shell = (testID: string) => screen.getByTestId(testID).parentElement!;

    it('scrolls the selected tab into view as the strip shows it and when it changes, only as far as it must', () => {
      const {rerender} = render(<TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t"/>);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({block: 'nearest', inline: 'nearest'});
      rerender(<TabView tabs={TABS} selected="c" onSelect={() => {}} testID="t"/>);
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      // A render with the same selection moves nothing.
      rerender(<TabView tabs={[...TABS]} selected="c" onSelect={() => {}} testID="t"/>);
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      // The shell, not the tab inside it: the body is inset by the shell's
      // padding, so scrolling the body alone would leave the pill's ends cut
      // at the strip's edges.
      expect(shell('t-tab-a')).toHaveClass('ui-tab-view__tab');
      expect(scrollIntoView.mock.contexts).toEqual([shell('t-tab-a'), shell('t-tab-c')]);
    });

    it('waits for a tab selected before it is in the list, and scrolls to it once it is', () => {
      const {rerender} = render(<TabView tabs={TABS} selected="d" onSelect={() => {}} testID="t"/>);
      expect(scrollIntoView).not.toHaveBeenCalled();
      rerender(<TabView tabs={[...TABS, {id: 'd', title: 'Draft'}]} selected="d" onSelect={() => {}} testID="t"/>);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.contexts[0]).toBe(shell('t-tab-d'));
    });

    it('scrolls the selected card into view as the switcher opens', async () => {
      const user = userEvent.setup();
      windowWidth(480);
      render(<TabView tabs={TABS} selected="b" onSelect={() => {}} testID="t"/>);
      // The bar alone has no tab to scroll to.
      expect(scrollIntoView).not.toHaveBeenCalled();
      await user.click(screen.getByTestId('t-switcher'));
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(shell('t-card-b')).toHaveClass('ui-tab-view__card');
      expect(scrollIntoView.mock.contexts[0]).toBe(shell('t-card-b'));
    });
  });
});
