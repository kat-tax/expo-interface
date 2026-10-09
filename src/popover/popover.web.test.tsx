import {act, fireEvent, render, screen} from '@testing-library/react';
import {AccentProvider} from '../accent';
import {Menu} from '../menu';
import {PopupMenu} from '../popup-menu';
import {Sheet} from '../sheet';
import {Popover} from '.';

describe('Popover (web)', () => {
  it('draws the card on a material of its own, or the app\'s, and as itself otherwise', () => {
    /** The card: the surface in the placed box. */
    const card = () => screen.getByTestId('pop').firstElementChild as HTMLElement;
    const {rerender} = render(<Popover at={{x: 10, y: 10}} title="Spelling" material="regular" testID="pop"/>);
    expect(card().dataset).toMatchObject({material: 'regular', materialFill: 'element', materialEdge: 'float'});
    expect(getComputedStyle(card()).boxShadow).toBe('');
    rerender(
      <AccentProvider overlayMaterial="thin">
        <Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>
      </AccentProvider>,
    );
    expect(card().dataset.material).toBe('thin');
    rerender(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
    expect(card().dataset.material).toBeUndefined();
    expect(getComputedStyle(card()).backgroundColor).toBe('var(--color-background-element)');
    expect(getComputedStyle(card()).boxShadow).toContain('rgba(0, 0, 0, 0.18)');
  });

  it('reports Escape wherever the focus is, before an editor that keeps the key can', () => {
    const onDismiss = vi.fn();
    render(
      <>
        <div contentEditable data-testid="editor" onKeyDown={event => event.stopPropagation()}/>
        <Popover at={{x: 10, y: 10}} title="Spelling" onDismiss={onDismiss} testID="pop"/>
      </>,
    );
    const editor = screen.getByTestId('editor');
    editor.focus();
    fireEvent.keyDown(editor, {key: 'Escape'});
    expect(onDismiss).toHaveBeenCalledWith('escape');
    fireEvent.keyDown(editor, {key: 'a'});
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe('the Escape it takes', () => {
    /** An editor holding the focus, with what its own keydown listener heard. */
    const editor = () => {
      const node = screen.getByTestId('editor');
      const heard = vi.fn();
      node.addEventListener('keydown', event => heard(event.key));
      node.focus();
      return {node, heard};
    };

    it('keeps the key from an editor once it has taken it', () => {
      const onDismiss = vi.fn();
      render(
        <>
          <div contentEditable data-testid="editor"/>
          <Popover at={{x: 10, y: 10}} title="Spelling" onDismiss={onDismiss} testID="pop"/>
        </>,
      );
      const {node, heard} = editor();
      fireEvent.keyDown(node, {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
      expect(heard).not.toHaveBeenCalled();
      // Any other key is the editor's.
      fireEvent.keyDown(node, {key: 'a'});
      expect(heard).toHaveBeenCalledWith('a');
    });

    it('keeps the key from a web Sheet the card is in', () => {
      const onDismiss = vi.fn();
      const onSheetDismiss = vi.fn();
      const sheet = (at: {x: number; y: number} | null) => (
        <Sheet isPresented onDismiss={onSheetDismiss}>
          <Popover at={at} title="Option" onDismiss={onDismiss} testID="pop"/>
        </Sheet>
      );
      const {rerender} = render(sheet({x: 10, y: 10}));
      fireEvent.keyDown(screen.getByTestId('pop'), {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
      expect(onSheetDismiss).not.toHaveBeenCalled();
      // With the card down, the key is the sheet's.
      rerender(sheet(null));
      fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
      expect(onSheetDismiss).toHaveBeenCalledTimes(1);
    });

    it('leaves Escape alone for a card nothing closes', () => {
      render(
        <>
          <div contentEditable data-testid="editor"/>
          <Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>
        </>,
      );
      const {node, heard} = editor();
      fireEvent.keyDown(node, {key: 'Escape'});
      expect(heard).toHaveBeenCalledWith('Escape');
      expect(screen.getByTestId('pop')).toBeInTheDocument();
    });

    it('closes the inner of two cards, one up inside the other, and leaves the outer for the next', () => {
      const outer = vi.fn();
      const inner = vi.fn();
      const cards = (at: {x: number; y: number} | null) => (
        <Popover at={{x: 10, y: 10}} title="Option" onDismiss={outer} testID="outer">
          <Popover at={at} title="Detail" onDismiss={inner} testID="inner"/>
        </Popover>
      );
      const {rerender} = render(cards({x: 20, y: 20}));
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(inner).toHaveBeenCalledWith('escape');
      expect(outer).not.toHaveBeenCalled();
      rerender(cards(null));
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(outer).toHaveBeenCalledWith('escape');
      expect(inner).toHaveBeenCalledTimes(1);
    });

    it('closes the card that came up last of two side by side', () => {
      const first = vi.fn();
      const second = vi.fn();
      const cards = (at: {x: number; y: number} | null) => (
        <>
          <Popover at={{x: 10, y: 10}} title="First" onDismiss={first}/>
          <Popover at={at} title="Second" onDismiss={second}/>
        </>
      );
      const {rerender} = render(cards(null));
      rerender(cards({x: 200, y: 10}));
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(second).toHaveBeenCalledWith('escape');
      expect(first).not.toHaveBeenCalled();
      rerender(cards(null));
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(first).toHaveBeenCalledWith('escape');
    });

    it('takes Escape for a lingering card with nothing to call, since it ends the linger itself', () => {
      const card = (at: {x: number; y: number} | null) => (
        <>
          <div contentEditable data-testid="editor"/>
          <Popover at={at} title="Spelling" trigger="hover" testID="pop"/>
        </>
      );
      const {rerender} = render(card({x: 10, y: 10}));
      rerender(card(null));
      const {node, heard} = editor();
      act(() => {
        fireEvent.keyDown(node, {key: 'Escape'});
      });
      expect(screen.queryByTestId('pop')).toBeNull();
      expect(heard).not.toHaveBeenCalled();
    });
  });

  describe('with a menu open in it', () => {
    type PopoverElement = Omit<HTMLElement, 'showPopover' | 'hidePopover'> & {
      showPopover?: () => void;
      hidePopover?: () => void;
    };
    const proto = HTMLElement.prototype as PopoverElement;
    /** The popovers the browser has open; jsdom ships no imperative Popover API, so it is stubbed. */
    const open = new Set<Element>();
    let matches: {mockRestore: () => void} | undefined;
    beforeAll(() => {
      proto.showPopover = function (this: HTMLElement) {
        open.add(this);
      };
      proto.hidePopover = function (this: HTMLElement) {
        open.delete(this);
      };
      const original = HTMLElement.prototype.matches;
      matches = vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
        return selector === ':popover-open' ? open.has(this) : original.call(this, selector);
      });
    });

    afterEach(() => {
      open.clear();
    });

    afterAll(() => {
      delete proto.showPopover;
      delete proto.hidePopover;
      matches?.mockRestore();
    });

    const items = [{label: 'Heading'}, {label: 'Quote'}];

    it('leaves the first Escape to a popup menu open in it, and takes the next', () => {
      const onDismiss = vi.fn();
      const onMenuDismiss = vi.fn();
      render(
        <Popover at={{x: 10, y: 10}} modal title="Option" onDismiss={onDismiss} testID="pop">
          <PopupMenu items={items} at={{x: 5, y: 5}} onDismiss={onMenuDismiss}/>
        </Popover>,
      );
      const menu = screen.getByRole('menu', {hidden: true});
      expect(open.has(menu)).toBe(true);
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(open.has(menu)).toBe(false);
      expect(onDismiss).not.toHaveBeenCalled();
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
    });

    it('leaves the first Escape to a Menu open in it, which closes itself, and takes the next', () => {
      const onDismiss = vi.fn();
      const heard = vi.fn();
      render(
        <Popover at={{x: 10, y: 10}} title="Option" onDismiss={onDismiss} testID="pop">
          <Menu label="Sort" items={items}/>
        </Popover>,
      );
      // The trigger's `popovertarget` opens it, as the browser would.
      const menu = screen.getByRole('menu', {hidden: true});
      open.add(menu);
      const listener = (event: KeyboardEvent) => heard(event.key);
      document.addEventListener('keydown', listener);
      try {
        // The menu takes the key and closes; the key stops at the window.
        fireEvent.keyDown(document.body, {key: 'Escape'});
        expect(open.has(menu)).toBe(false);
        expect(heard).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
        // With the menu down, the next Escape is the card's.
        fireEvent.keyDown(document.body, {key: 'Escape'});
        expect(onDismiss).toHaveBeenCalledWith('escape');
        expect(heard).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', listener);
      }
    });

    it('leaves Escape to a Menu opened beside it over a card that came up first, which the top layer draws over the card', () => {
      const onDismiss = vi.fn();
      render(
        <>
          <Menu label="Sort" items={items}/>
          <Popover at={{x: 10, y: 10}} title="Option" onDismiss={onDismiss} testID="pop"/>
        </>,
      );
      // The menu, mounted before the card came up, opens over it.
      const menu = screen.getByRole('menu', {hidden: true});
      open.add(menu);
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(open.has(menu)).toBe(false);
      expect(onDismiss).not.toHaveBeenCalled();
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
    });

    it('leaves Escape to the browser for a popover open in it that takes no Escape itself, as a ColorPicker\'s is', () => {
      const onDismiss = vi.fn();
      const heard = vi.fn();
      render(
        <Popover at={{x: 10, y: 10}} title="Option" onDismiss={onDismiss} testID="pop">
          <div popover="auto" data-testid="picker"/>
        </Popover>,
      );
      open.add(screen.getByTestId('picker'));
      const listener = (event: KeyboardEvent) => heard(event.key);
      document.addEventListener('keydown', listener);
      try {
        // The key is not taken: it goes on, uncancelled, to the browser's close of the popover.
        expect(fireEvent.keyDown(document.body, {key: 'Escape'})).toBe(true);
        expect(heard).toHaveBeenCalledWith('Escape');
        expect(onDismiss).not.toHaveBeenCalled();
        open.clear();
        fireEvent.keyDown(document.body, {key: 'Escape'});
        expect(onDismiss).toHaveBeenCalledWith('escape');
        expect(heard).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', listener);
      }
    });

    it('leaves Escape to a popup menu that comes up beside it after it', () => {
      const onDismiss = vi.fn();
      const page = (at: {x: number; y: number} | null) => (
        <>
          <Popover at={{x: 10, y: 10}} title="Option" onDismiss={onDismiss} testID="pop"/>
          <PopupMenu items={items} at={at}/>
        </>
      );
      const {rerender} = render(page(null));
      rerender(page({x: 200, y: 10}));
      const menu = screen.getByRole('menu', {hidden: true});
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(open.has(menu)).toBe(false);
      expect(onDismiss).not.toHaveBeenCalled();
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
    });

    it('takes Escape over a manual popover open in it, which the key does not close', () => {
      const onDismiss = vi.fn();
      render(
        <Popover at={{x: 10, y: 10}} title="Option" onDismiss={onDismiss} testID="pop">
          <div popover="manual" data-testid="note"/>
        </Popover>,
      );
      open.add(screen.getByTestId('note'));
      fireEvent.keyDown(document.body, {key: 'Escape'});
      expect(onDismiss).toHaveBeenCalledWith('escape');
    });
  });

  it('listens for Escape only while it is up', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<Popover at={null} title="Spelling" onDismiss={onDismiss}/>);
    fireEvent.keyDown(document.body, {key: 'Escape'});
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(<Popover at={{x: 0, y: 0}} title="Spelling" onDismiss={onDismiss}/>);
    rerender(<Popover at={null} title="Spelling" onDismiss={onDismiss}/>);
    fireEvent.keyDown(document.body, {key: 'Escape'});
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ends a hover card\'s linger on Escape, and says a modal card is a modal dialog named by its title', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<Popover at={{x: 10, y: 10}} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
    rerender(<Popover at={null} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
    expect(screen.getByTestId('pop')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document.body, {key: 'Escape'});
    });
    expect(screen.queryByTestId('pop')).toBeNull();
    expect(onDismiss).toHaveBeenCalledWith('escape');
    rerender(<Popover at={{x: 10, y: 10}} title="Option" modal testID="modal"/>);
    const card = screen.getByTestId('modal');
    expect(card).toHaveAttribute('role', 'dialog');
    expect(card).toHaveAttribute('aria-modal', 'true');
    expect(card).toHaveAttribute('aria-label', 'Option');
    // The backdrop is a button that dismisses the card.
    expect(screen.getByRole('button', {name: 'Dismiss'})).toBe(screen.getByTestId('modal-backdrop'));
  });

  it('ends on Escape the linger the app\'s clearing of the rectangle would start', () => {
    const onDismiss = vi.fn();
    const {rerender} = render(<Popover at={{x: 10, y: 10}} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
    act(() => {
      fireEvent.keyDown(document.body, {key: 'Escape'});
    });
    expect(onDismiss).toHaveBeenCalledWith('escape');
    rerender(<Popover at={null} title="Spelling" trigger="hover" onDismiss={onDismiss} testID="pop"/>);
    expect(screen.queryByTestId('pop')).toBeNull();
  });

  it('names a modal card by its label, or by its title without one', () => {
    const modal = (props: {title?: string; label?: string}) => <Popover at={{x: 10, y: 10}} modal testID="modal" {...props}/>;
    const {rerender} = render(modal({label: 'Status'}));
    expect(screen.getByTestId('modal')).toHaveAttribute('aria-label', 'Status');
    rerender(modal({label: 'Status', title: 'Pick one'}));
    expect(screen.getByTestId('modal')).toHaveAttribute('aria-label', 'Status');
    rerender(modal({title: 'Pick one'}));
    expect(screen.getByTestId('modal')).toHaveAttribute('aria-label', 'Pick one');
    rerender(modal({}));
    expect(screen.getByTestId('modal')).not.toHaveAttribute('aria-label');
  });

  describe('once laid out', () => {
    /**
     * react-native-web reports a layout from a `ResizeObserver`, which jsdom
     * lacks: this one keeps its callback, so a test can lay a node out.
     * react-native-web makes its one observer on the first `onLayout` it
     * meets with the class present, so it is this one from here on.
     */
    let report: ((entries: {target: Element}[]) => void) | undefined;
    beforeEach(() => {
      vi.stubGlobal('ResizeObserver', class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    /** Lays the nodes out, as the browser reports them; each measure lands in a timeout. */
    const layOut = async (...targets: Element[]) => {
      await act(async () => {
        report?.(targets.map(target => ({target})));
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    };

    it('is drawn, its actions with it, once react-native-web has measured it', async () => {
      render(<Popover at={{x: 10, y: 10}} title="Spelling" actions={[{label: 'Fix', onPress: vi.fn()}]} testID="pop"/>);
      const card = screen.getByTestId('pop');
      expect(getComputedStyle(card).opacity).toBe('0');
      expect(getComputedStyle(card).pointerEvents).toBe('none');
      // The browser lays the whole card out at once, so it does not wait
      // for its actions apart.
      await layOut(card, screen.getByTestId('pop-bounds'));
      expect(getComputedStyle(card).opacity).not.toBe('0');
      expect(getComputedStyle(card).pointerEvents).not.toBe('none');
    });

    describe('timeout by timeout', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      /**
       * Reports the nodes, as the browser does, and runs the measures
       * react-native-web queues for them, each in a timeout of its own. A
       * timeout the card sets from its own measure comes after these.
       */
      const measure = (...targets: Element[]) => {
        act(() => {
          report?.(targets.map(target => ({target})));
        });
        act(() => {
          vi.advanceTimersByTime(0);
        });
      };

      it('waits for its parent, which the browser reports just after a card that mounts with it', () => {
        render(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
        const card = screen.getByTestId('pop');
        measure(card);
        // Placed from the card alone it would sit below the rectangle, unclamped.
        expect(getComputedStyle(card).opacity).toBe('0');
        // jsdom measures every node as empty: a parent with no size counts.
        measure(screen.getByTestId('pop-bounds'));
        expect(getComputedStyle(card).opacity).not.toBe('0');
      });

      it('is drawn a task after its own measure in a parent the browser does not report', () => {
        render(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
        const card = screen.getByTestId('pop');
        // A parent with no size gets no first report from a ResizeObserver.
        measure(card);
        expect(getComputedStyle(card).opacity).toBe('0');
        act(() => {
          vi.advanceTimersToNextTimer();
        });
        expect(getComputedStyle(card).opacity).not.toBe('0');
        expect(getComputedStyle(card).pointerEvents).not.toBe('none');
      });
    });

    it('draws a card that comes up in a parent already measured once it is measured itself', async () => {
      const {rerender} = render(<Popover at={null} title="Spelling" testID="pop"/>);
      await layOut(screen.getByTestId('pop-bounds'));
      rerender(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
      const card = screen.getByTestId('pop');
      expect(getComputedStyle(card).opacity).toBe('0');
      await layOut(card);
      expect(getComputedStyle(card).opacity).not.toBe('0');
    });
  });

  it('works without anything to call', () => {
    render(<Popover at={{x: 0, y: 0}} title="Spelling" modal testID="pop"/>);
    fireEvent.keyDown(document.body, {key: 'Escape'});
    fireEvent.click(screen.getByTestId('pop-backdrop'));
    expect(screen.getByTestId('pop')).toBeInTheDocument();
  });
});
