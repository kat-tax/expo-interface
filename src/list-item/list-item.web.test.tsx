import {fireEvent, render, screen} from '@testing-library/react';
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
