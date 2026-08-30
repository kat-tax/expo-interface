import {fireEvent, render, screen} from '@testing-library/react';
import {TextField} from '.';

describe('TextField (web)', () => {
  it('renders an <input> whose placeholder doubles as the accessible name', () => {
    render(<TextField placeholder="Name" testID="name"/>);
    const input = screen.getByTestId('name');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('placeholder', 'Name');
    expect(screen.getByRole('textbox', {name: 'Name'})).toBe(input);
  });

  it('keeps its own state when uncontrolled', () => {
    const onChangeText = jest.fn();
    render(<TextField placeholder="Name" onChangeText={onChangeText} testID="name"/>);
    const input = screen.getByTestId('name');
    expect(input).toHaveValue('');
    fireEvent.change(input, {target: {value: 'Ada'}});
    expect(onChangeText).toHaveBeenCalledWith('Ada');
    expect(input).toHaveValue('Ada');
  });

  it('reflects a controlled value and reports edits without applying them', () => {
    const onChangeText = jest.fn();
    const {rerender} = render(<TextField value="Ada" onChangeText={onChangeText} testID="name"/>);
    const input = screen.getByTestId('name');
    expect(input).toHaveValue('Ada');
    fireEvent.change(input, {target: {value: 'Ada L'}});
    expect(onChangeText).toHaveBeenCalledWith('Ada L');
    expect(input).toHaveValue('Ada');
    rerender(<TextField value="Grace" onChangeText={onChangeText} testID="name"/>);
    expect(input).toHaveValue('Grace');
  });

  it('submits the current text on Enter', () => {
    const onSubmit = jest.fn();
    render(<TextField onSubmit={onSubmit} testID="query"/>);
    const input = screen.getByTestId('query');
    fireEvent.change(input, {target: {value: 'hello'}});
    fireEvent.keyDown(input, {key: 'Enter', keyCode: 13});
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('becomes read-only when disabled', () => {
    const {rerender} = render(<TextField value="Locked" testID="field"/>);
    expect(screen.getByTestId('field')).not.toHaveAttribute('readonly');
    rerender(<TextField value="Locked" disabled testID="field"/>);
    expect(screen.getByTestId('field')).toHaveAttribute('readonly');
  });

  it('masks secure entry', () => {
    render(<TextField placeholder="Password" secureTextEntry testID="pw"/>);
    expect(screen.getByTestId('pw')).toHaveAttribute('type', 'password');
  });

  it('maps keyboard types to input types and modes', () => {
    render(
      <>
        <TextField keyboardType="email" testID="email"/>
        <TextField keyboardType="number" testID="number"/>
        <TextField keyboardType="phone" testID="phone"/>
        <TextField keyboardType="decimal" testID="decimal"/>
        <TextField keyboardType="url" testID="url"/>
        <TextField keyboardType="default" testID="default"/>
      </>,
    );
    expect(screen.getByTestId('email')).toHaveAttribute('type', 'email');
    expect(screen.getByTestId('number')).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByTestId('phone')).toHaveAttribute('type', 'tel');
    expect(screen.getByTestId('decimal')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByTestId('url')).toHaveAttribute('type', 'url');
    expect(screen.getByTestId('default')).not.toHaveAttribute('inputmode');
  });

  it('renders a <textarea> for multiline input', () => {
    render(<TextField placeholder="Notes" multiline testID="notes"/>);
    const area = screen.getByTestId('notes');
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveAttribute('aria-label', 'Notes');
  });

  it('forwards capitalization, autocorrect and length limits', () => {
    render(<TextField autoCapitalize="none" autoCorrect={false} maxLength={6} testID="code"/>);
    const input = screen.getByTestId('code');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('maxlength', '6');
  });
});
