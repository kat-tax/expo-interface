import {fireEvent, render, screen} from '@testing-library/react';
import {ListItem} from '.';

describe('ListItem (web)', () => {
  it('renders the headline in a row', () => {
    render(<ListItem testID="row">Wi-Fi</ListItem>);
    const row = screen.getByTestId('row');
    expect(row).toHaveTextContent('Wi-Fi');
    expect(row.querySelectorAll(':scope > div')).toHaveLength(1);
  });

  it('renders leading and trailing slots around the headline', () => {
    render(
      <ListItem leading={<span>L</span>} trailing={<span>T</span>} testID="row">
        Head
      </ListItem>,
    );
    const row = screen.getByTestId('row');
    const [leading, main, trailing] = Array.from(row.querySelectorAll(':scope > div'));
    expect(leading).toHaveTextContent('L');
    expect(main).toHaveTextContent('Head');
    expect(trailing).toHaveTextContent('T');
  });

  it('renders supporting text below the headline', () => {
    render(<ListItem supporting="Connected" testID="row">Wi-Fi</ListItem>);
    const row = screen.getByTestId('row');
    const main = row.querySelector(':scope > div')!;
    expect(main.children).toHaveLength(2);
    expect(main.children[0]).toHaveTextContent('Wi-Fi');
    expect(main.children[1]).toHaveTextContent('Connected');
  });

  it('accepts rich supporting content', () => {
    render(<ListItem supporting={<em data-testid="rich">Rich</em>}>Head</ListItem>);
    expect(screen.getByTestId('rich')).toHaveTextContent('Rich');
  });

  it('calls onPress over the whole row', () => {
    const onPress = vi.fn();
    render(<ListItem onPress={onPress} testID="row">Tap</ListItem>);
    fireEvent.click(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not throw without onPress', () => {
    render(<ListItem testID="row">Static</ListItem>);
    expect(() => fireEvent.click(screen.getByTestId('row'))).not.toThrow();
  });
});
