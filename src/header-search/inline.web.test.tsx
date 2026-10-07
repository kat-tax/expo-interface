import {fireEvent, render, screen} from '@testing-library/react';
import {NarrowBarContext} from '../tabs/context';
import {InlineField} from './inline';

const noop = () => {};

describe('the inline search field (web)', () => {
  it('draws no magnifier, only the input on the bar\'s fill', () => {
    render(<InlineField value="" placeholder="Search documents" onChangeText={noop} testID="q"/>);
    const row = screen.getByTestId('q-row');
    expect(row.querySelector('.ui-symbol')).toBeNull();
    expect(row.children).toHaveLength(1);
  });

  it('draws a hairline under the field for a focus from the keyboard, and none for one from a pointer', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<InlineField value="" placeholder="Search documents" onChangeText={noop} onFocus={onFocus} onBlur={onBlur} testID="q"/>);
    const input = screen.getByRole('searchbox');
    const row = screen.getByTestId('q-row');
    // Tabbed into: the keyboard's focus.
    fireEvent.focus(input);
    expect(row).toHaveClass('ui-header-search--keyboard');
    fireEvent.blur(input);
    expect(row).not.toHaveClass('ui-header-search--keyboard');
    // Clicked into: the pointer's, which the caret alone shows.
    fireEvent.pointerDown(input);
    fireEvent.focus(input);
    expect(row).not.toHaveClass('ui-header-search--keyboard');
    fireEvent.blur(input);
    // And the next focus from the keyboard is the keyboard's again.
    fireEvent.focus(input);
    expect(row).toHaveClass('ui-header-search--keyboard');
    expect(onFocus).toHaveBeenCalledTimes(3);
    expect(onBlur).toHaveBeenCalledTimes(2);
  });

  it('shows the short placeholder in a narrow bar, keeping the full one as its name', () => {
    render(
      <NarrowBarContext.Provider value={true}>
        <InlineField value="" placeholder="Search documents" shortPlaceholder="Search docs" onChangeText={noop}/>
      </NarrowBarContext.Provider>,
    );
    const input = screen.getByRole('searchbox', {name: 'Search documents'});
    expect(input).toHaveAttribute('placeholder', 'Search docs');
  });

  it('keeps the full placeholder in a narrow bar without a short one, and names itself Search without either', () => {
    render(
      <NarrowBarContext.Provider value={true}>
        <InlineField value="" placeholder="Search documents" onChangeText={noop}/>
        <InlineField value="" onChangeText={noop} testID="bare"/>
      </NarrowBarContext.Provider>,
    );
    expect(screen.getByRole('searchbox', {name: 'Search documents'})).toHaveAttribute('placeholder', 'Search documents');
    expect(screen.getByTestId('bare')).toHaveAttribute('aria-label', 'Search');
  });
});
