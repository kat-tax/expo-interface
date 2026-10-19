import {readFileSync} from 'node:fs';
import path from 'node:path';
import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LONG_PRESS_MS} from '../context-menu/held';
import {ListItem} from '.';

describe('ListItem (web)', () => {
  it('renders the headline in an inert row', () => {
    render(<ListItem testID="row">Wi-Fi</ListItem>);
    const row = screen.getByTestId('row');
    expect(row.tagName).toBe('DIV');
    expect(row).toHaveClass('ui-list-item');
    expect(row.querySelector('.ui-list-item__headline')).toHaveTextContent('Wi-Fi');
    expect(row.querySelector('.ui-list-item__slot')).toBeNull();
  });

  it('names an inert row from its slots as a group, beside an action too', () => {
    render(
      <>
        <ListItem supporting="Edited yesterday" value="2 KB" badge={3} testID="plain">Essay</ListItem>
        <ListItem supporting="Signed out" action={{label: 'Sign in', onPress: vi.fn()}} testID="beside">Account</ListItem>
      </>,
    );
    expect(screen.getByRole('group', {name: 'Essay, Edited yesterday, 2 KB, 3 new'})).toBe(screen.getByTestId('plain'));
    const inner = screen.getByRole('group', {name: 'Account, Signed out'});
    expect(inner).toHaveClass('ui-list-item__row');
    expect(screen.getByTestId('beside').contains(inner)).toBe(true);
  });

  it('leaves an inert row whose headline is content of the app\'s own unnamed and without a role', () => {
    render(
      <>
        <ListItem testID="plain"><em>Essay</em></ListItem>
        <ListItem action={{label: 'Sign in', onPress: vi.fn()}} testID="beside"><em>Account</em></ListItem>
      </>,
    );
    expect(screen.queryAllByRole('group')).toHaveLength(0);
    expect(screen.getByTestId('plain')).not.toHaveAttribute('aria-label');
  });

  it('renders leading and trailing slots around the headline', () => {
    render(
      <ListItem leading={<span>L</span>} trailing={<span>T</span>} testID="row">
        Head
      </ListItem>,
    );
    const row = screen.getByTestId('row');
    const [leading, trailing] = row.querySelectorAll('.ui-list-item__slot');
    expect(leading).toHaveTextContent('L');
    expect(row.querySelector('.ui-list-item__main')).toHaveTextContent('Head');
    expect(trailing).toHaveTextContent('T');
  });

  it('renders supporting text below the headline', () => {
    render(<ListItem supporting="Connected" testID="row">Wi-Fi</ListItem>);
    const main = screen.getByTestId('row').querySelector('.ui-list-item__main')!;
    expect(main.children).toHaveLength(2);
    expect(main.children[0]).toHaveTextContent('Wi-Fi');
    expect(main.children[1]).toHaveTextContent('Connected');
  });

  it('keeps the supporting text\'s line breaks', () => {
    render(<ListItem supporting={'Edited yesterday\nShared with Ana'} testID="row">Essay</ListItem>);
    expect(screen.getByTestId('row').querySelector('.ui-list-item__supporting')!.textContent).toBe('Edited yesterday\nShared with Ana');
    // The project does not apply imported stylesheets, so the rule is read from the file.
    const css = readFileSync(path.join(__dirname, 'list-item.css'), 'utf8');
    expect(css).toMatch(/\.ui-list-item__supporting \{[^}]*white-space: pre-line;/);
  });

  it('accepts rich supporting content', () => {
    render(<ListItem supporting={<em data-testid="rich">Rich</em>}>Head</ListItem>);
    expect(screen.getByTestId('rich')).toHaveTextContent('Rich');
  });

  it('calls onPress over the whole row, which is the button itself', () => {
    const onPress = vi.fn();
    render(<ListItem onPress={onPress} testID="row">Tap</ListItem>);
    const row = screen.getByTestId('row');
    expect(row.tagName).toBe('BUTTON');
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not throw without onPress', () => {
    render(<ListItem testID="row">Static</ListItem>);
    expect(() => fireEvent.click(screen.getByTestId('row'))).not.toThrow();
  });

  it('renders a trailing action as a button beside an inert row', () => {
    const onSignIn = vi.fn();
    render(
      <ListItem leading={<span>L</span>} trailing={<span>T</span>} supporting="Signed out" action={{label: 'Sign in', onPress: onSignIn}} testID="row">
        Account
      </ListItem>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('ui-list-item');
    expect(row.querySelector('.ui-list-item__row')?.tagName).toBe('DIV');
    expect(row.querySelector('.ui-list-item__headline')).toHaveTextContent('Account');
    expect(row.querySelector('.ui-list-item__supporting')).toHaveTextContent('Signed out');
    const slots = row.querySelectorAll('.ui-list-item__slot');
    expect(slots[0]).toHaveTextContent('L');
    expect(slots[1]).toHaveTextContent('T');
    const action = screen.getByRole('button', {name: 'Sign in'});
    expect(action).toHaveClass('ui-button--text', 'ui-button--small');
    expect(action.parentElement).toBe(row);
    fireEvent.click(action);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('marks a loading action busy', () => {
    render(<ListItem action={{label: 'Signing in', onPress: vi.fn(), loading: true}} testID="row">Account</ListItem>);
    const action = screen.getByRole('button', {name: 'Signing in'});
    expect(action).toHaveAttribute('aria-busy', 'true');
    expect(action).toBeDisabled();
  });

  it('keeps the row pressable beside the action, without the action pressing it', () => {
    const onPress = vi.fn();
    const onSignOut = vi.fn();
    render(
      <ListItem onPress={onPress} supporting={<em>Rich</em>} action={{label: 'Sign out', onPress: onSignOut, role: 'destructive', disabled: true}} testID="row">
        Account
      </ListItem>,
    );
    const row = screen.getByRole('button', {name: /Account/});
    expect(row).toHaveClass('ui-list-item__row--pressable');
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
    const action = screen.getByRole('button', {name: 'Sign out'});
    expect(action).toHaveClass('ui-button--destructive');
    expect(action).toBeDisabled();
    fireEvent.click(action);
    expect(onSignOut).not.toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('row').querySelector('.ui-list-item__slot')).toBeNull();
  });

  it('draws a filled action as a rounded control', () => {
    render(<ListItem action={{label: 'Sign in', variant: 'filled', onPress: vi.fn()}} testID="row">Account</ListItem>);
    const action = screen.getByRole('button', {name: 'Sign in'});
    expect(action).toHaveClass('ui-button--filled', 'ui-button--rounded', 'ui-button--small');
    expect(action).not.toHaveClass('ui-button--text');
  });

  it('fills a selected row that presses, over the reset that strips its button\'s own fill', () => {
    // Vitest processes no stylesheet in this project, so the sheet goes into
    // the page by hand, and jsdom's cascade applies its rules to the rows.
    const sheet = document.createElement('style');
    sheet.textContent = readFileSync(path.join(__dirname, 'list-item.css'), 'utf8');
    document.head.append(sheet);
    try {
      render(
        <>
          <ListItem selected onPress={vi.fn()} testID="pressable">Version 3</ListItem>
          <ListItem selected onPress={vi.fn()} action={{label: 'Restore', onPress: vi.fn()}} testID="acting">Version 2</ListItem>
          <ListItem selected testID="inert">Version 1</ListItem>
          <ListItem onPress={vi.fn()} testID="plain">Version 0</ListItem>
        </>,
      );
      const fill = (element: Element) => getComputedStyle(element).backgroundColor;
      const pressable = screen.getByTestId('pressable');
      expect(pressable.tagName).toBe('BUTTON');
      expect(fill(pressable)).toBe('var(--color-background-selected)');
      // With an action the row is a `<div>` around its own `<button>`, which
      // stays clear, so the row's fill shows through it.
      const acting = screen.getByTestId('acting');
      expect(acting.tagName).toBe('DIV');
      expect(fill(acting)).toBe('var(--color-background-selected)');
      expect(fill(acting.querySelector('button.ui-list-item__row')!)).toBe('rgba(0, 0, 0, 0)');
      expect(fill(screen.getByTestId('inert'))).toBe('var(--color-background-selected)');
      // A pressable row that is not selected keeps the reset: `transparent`, as jsdom serializes it.
      expect(fill(screen.getByTestId('plain'))).toBe('rgba(0, 0, 0, 0)');
    } finally {
      sheet.remove();
    }
  });

  it('drops its own padding when the container draws the inset', () => {
    const {rerender} = render(<ListItem inset={false} testID="row">Account</ListItem>);
    expect(screen.getByTestId('row')).toHaveClass('ui-list-item', 'ui-list-item--flush');
    rerender(<ListItem inset={false} onPress={vi.fn()} testID="row">Account</ListItem>);
    expect(screen.getByTestId('row')).toHaveClass('ui-list-item--flush');
    rerender(<ListItem inset={false} action={{label: 'Sign in', onPress: vi.fn()}} testID="row">Account</ListItem>);
    expect(screen.getByTestId('row')).toHaveClass('ui-list-item--flush');
    rerender(<ListItem testID="row">Account</ListItem>);
    expect(screen.getByTestId('row')).not.toHaveClass('ui-list-item--flush');
  });

  it('renders an action row without supporting text, or with a number', () => {
    const {rerender} = render(<ListItem action={{label: 'Clear', onPress: vi.fn()}} testID="row">Cache</ListItem>);
    expect(screen.getByTestId('row').querySelector('.ui-list-item__supporting')).toBeNull();
    rerender(<ListItem supporting={42} action={{label: 'Clear', onPress: vi.fn()}} testID="row">Cache</ListItem>);
    expect(screen.getByTestId('row').querySelector('.ui-list-item__supporting')).toHaveTextContent('42');
  });
});

/** A pointer event with a `pointerType`; jsdom has no `PointerEvent` constructor. */
function pointerEvent(type: string, pointerType: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true, ...init});
  Object.defineProperty(event, 'pointerType', {value: pointerType});
  return event;
}

type PopoverElement = Omit<HTMLElement, 'showPopover'> & {showPopover?: () => void};
const proto = HTMLElement.prototype as PopoverElement;

// jsdom 30 hides a closed popover, so the menu is queried with `hidden:
// true`, and it has no imperative Popover API, so `showPopover` is stubbed.
describe('row actions (web)', () => {
  const actions = [{label: 'Share', onPress: vi.fn()}, {label: 'Delete', role: 'destructive' as const, onPress: vi.fn()}];
  const showPopover = vi.fn();

  beforeAll(() => {
    proto.showPopover = showPopover;
  });

  afterAll(() => {
    delete proto.showPopover;
  });

  it('puts them in the row\'s own popover menu, opened by a right click', () => {
    render(<ListItem swipeActions={actions} testID="row">Essay</ListItem>);
    const menu = screen.getByRole('menu', {hidden: true});
    expect([...menu.querySelectorAll('[role="menuitem"]')].map(item => item.textContent)).toEqual(['Share', 'Delete']);
  });

  it('leaves the row alone when it has no actions of its own', () => {
    render(<ListItem testID="plain">Essay</ListItem>);
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull();
  });

  it('keeps the row a button named by its label, which the keyboard reaches and presses', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<ListItem swipeActions={actions} supporting="Edited yesterday" onPress={onPress} testID="row">Essay</ListItem>);
    const row = screen.getByRole('button', {name: 'Essay, Edited yesterday'});
    expect(row).toBe(screen.getByTestId('row'));
    expect(row).toHaveClass('ui-list-item');
    await user.tab();
    expect(row).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(showPopover).not.toHaveBeenCalled();
  });

  it('opens the menu on a right click without pressing the row, and an entry chosen there presses only itself', () => {
    const onPress = vi.fn();
    render(<ListItem swipeActions={actions} onPress={onPress} testID="row">Essay</ListItem>);
    expect(fireEvent.contextMenu(screen.getByRole('button', {name: 'Essay'}), {clientX: 40, clientY: 60})).toBe(false);
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', {name: 'Share', hidden: true}));
    expect(actions[0]!.onPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps the press beside an action, and the menu around both', () => {
    const onPress = vi.fn();
    render(<ListItem swipeActions={actions} onPress={onPress} action={{label: 'Restore', onPress: vi.fn()}} testID="row">Version 2</ListItem>);
    fireEvent.click(screen.getByRole('button', {name: 'Version 2'}));
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.contextMenu(screen.getByTestId('row'));
    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  describe('a held touch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens the menu once it lifts, and its release\'s click does not press the row', () => {
      const onPress = vi.fn();
      render(<ListItem swipeActions={actions} onPress={onPress} testID="row">Essay</ListItem>);
      const row = screen.getByRole('button', {name: 'Essay'});
      fireEvent(row, pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
      fireEvent(row, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(row)).toBe(false);
      expect(onPress).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(0));
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(onPress).not.toHaveBeenCalled();
    });

    it('leaves a short tap to the row', () => {
      const onPress = vi.fn();
      render(<ListItem swipeActions={actions} onPress={onPress} testID="row">Essay</ListItem>);
      const row = screen.getByRole('button', {name: 'Essay'});
      fireEvent(row, pointerEvent('pointerdown', 'touch', {clientX: 10, clientY: 20}));
      act(() => vi.advanceTimersByTime(LONG_PRESS_MS - 1));
      fireEvent(row, pointerEvent('pointerup', 'touch'));
      expect(fireEvent.click(row)).toBe(true);
      expect(onPress).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(1000));
      expect(showPopover).not.toHaveBeenCalled();
    });
  });
});
