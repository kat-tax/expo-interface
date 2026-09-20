// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {SearchField} from '.';

describe('SearchField (web)', () => {
  it('is the browser\'s own search input, named even without a placeholder', () => {
    render(<SearchField value="" onChangeText={() => {}} testID="q"/>);
    const input = screen.getByTestId('q');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAccessibleName('Search');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
  });

  it('reports what was typed, and what was submitted', () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    render(<SearchField value="dem" placeholder="Find a drop" onChangeText={onChangeText} onSubmit={onSubmit} testID="q"/>);
    const input = screen.getByTestId('q');
    expect(input).toHaveAccessibleName('Find a drop');
    fireEvent.change(input, {target: {value: 'demo'}});
    expect(onChangeText).toHaveBeenCalledWith('demo');
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onSubmit).toHaveBeenCalledWith('dem');
    // Any other key is the field's business, not the kit's.
    fireEvent.keyDown(input, {key: 'a'});
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('hands the completions to a datalist, which is the browser\'s own combobox', () => {
    render(<SearchField value="d" suggestions={['Demo Reel', 'Drops']} onChangeText={() => {}} testID="q"/>);
    const input = screen.getByTestId('q');
    const list = input.getAttribute('list');
    expect(list).toBeTruthy();
    const datalist = document.getElementById(list!);
    expect(datalist?.tagName).toBe('DATALIST');
    expect([...datalist!.querySelectorAll('option')].map(option => option.value)).toEqual(['Demo Reel', 'Drops']);
  });

  it('writes no list at all when there is nothing to suggest', () => {
    render(<SearchField value="d" onChangeText={() => {}} testID="q"/>);
    expect(screen.getByTestId('q')).not.toHaveAttribute('list');
    render(<SearchField value="d" suggestions={[]} onChangeText={() => {}} testID="empty"/>);
    expect(screen.getByTestId('empty')).not.toHaveAttribute('list');
  });

  it('renders without a testID at all, which is the usual case', () => {
    render(<SearchField value="" onChangeText={() => {}}/>);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('disables the box, and flattens a style onto the row', () => {
    render(<SearchField value="" disabled onChangeText={() => {}} style={{opacity: 0.5}} testID="q"/>);
    expect(screen.getByTestId('q')).toBeDisabled();
    expect(screen.getByTestId('q-row')).toHaveStyle({opacity: 0.5});
  });
});
