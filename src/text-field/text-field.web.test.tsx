// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {TextFieldCommands} from './types';
import {createRef} from 'react';
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
    const onChangeText = vi.fn();
    render(<TextField placeholder="Name" onChangeText={onChangeText} testID="name"/>);
    const input = screen.getByTestId('name');
    expect(input).toHaveValue('');
    fireEvent.change(input, {target: {value: 'Ada'}});
    expect(onChangeText).toHaveBeenCalledWith('Ada');
    expect(input).toHaveValue('Ada');
  });

  it('reflects a controlled value and reports edits without applying them', () => {
    const onChangeText = vi.fn();
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
    const onSubmit = vi.fn();
    render(<TextField onSubmit={onSubmit} testID="query"/>);
    const input = screen.getByTestId('query');
    fireEvent.change(input, {target: {value: 'hello'}});
    fireEvent.keyDown(input, {key: 'Enter', keyCode: 13});
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('reports the focus coming and going, and takes and gives it up through the ref', () => {
    const ref = createRef<TextFieldCommands>();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<TextField ref={ref} placeholder="Name" onFocus={onFocus} onBlur={onBlur} testID="name"/>);
    const input = screen.getByTestId('name');
    ref.current!.focus();
    expect(document.activeElement).toBe(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    ref.current!.blur();
    expect(document.activeElement).not.toBe(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
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
        <TextField multiline keyboardType="email" testID="area"/>
        <TextField variant="inline" keyboardType="url" testID="inline-url"/>
        <TextField variant="inline" multiline keyboardType="phone" testID="inline-area"/>
      </>,
    );
    // A `<textarea>` has no type: the keyboard comes through `inputmode`.
    expect(screen.getByTestId('area')).toHaveAttribute('inputmode', 'email');
    expect(screen.getByTestId('inline-url')).toHaveAttribute('inputmode', 'url');
    expect(screen.getByTestId('inline-url')).toHaveAttribute('type', 'url');
    expect(screen.getByTestId('inline-area')).toHaveAttribute('inputmode', 'tel');
    expect(screen.getByTestId('email')).toHaveAttribute('inputmode', 'email');
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

  it('labels the keyboard action key and reports key presses', () => {
    const onKeyPress = vi.fn();
    render(<TextField returnKeyType="search" onKeyPress={onKeyPress} testID="query"/>);
    const input = screen.getByTestId('query');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    fireEvent.keyDown(input, {key: 'Enter', shiftKey: true});
    expect(onKeyPress).toHaveBeenCalledWith('Enter', true);
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onKeyPress).toHaveBeenLastCalledWith('Escape', false);
  });

  it('focuses on mount with autoFocus', () => {
    render(<TextField autoFocus testID="query"/>);
    expect(document.activeElement).toBe(screen.getByTestId('query'));
  });

  it('renders the inline variant as a borderless input that grows to its room', () => {
    const onSubmit = vi.fn();
    render(<TextField variant="inline" placeholder="Find in document" returnKeyType="next" onSubmit={onSubmit} autoFocus testID="find"/>);
    const input = screen.getByRole('textbox', {name: 'Find in document'});
    expect(input).toBe(screen.getByTestId('find'));
    expect(input).toHaveAttribute('enterkeyhint', 'next');
    expect(document.activeElement).toBe(input);
    expect(getComputedStyle(input).flexGrow).toBe('1');
    fireEvent.change(input, {target: {value: 'hello'}});
    fireEvent.keyDown(input, {key: 'Enter', keyCode: 13});
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('renders the bare variant with no padding and no focus ring of its own', () => {
    // Chrome's focus ring is `outline-style: auto`, which no width turns off.
    const ring = document.createElement('style');
    ring.textContent = 'input, textarea { outline-style: auto; }';
    document.head.append(ring);
    try {
      render(
        <>
          <TextField variant="bare" placeholder="Write" testID="bare"/>
          <TextField variant="inline" placeholder="Find" testID="inline"/>
        </>,
      );
      const style = getComputedStyle(screen.getByTestId('bare'));
      expect(style.paddingLeft).toBe('0px');
      expect(style.paddingTop).toBe('0px');
      expect(style.outlineStyle).toBe('none');
      // The inline field keeps the browser's ring.
      expect(getComputedStyle(screen.getByTestId('inline')).outlineStyle).toBe('auto');
    } finally {
      ring.remove();
    }
  });

  describe('the focus through Enter', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    /** Types into the field, focuses it, presses Enter, and lets react-native-web's deferred blur run. */
    function enter(input: HTMLElement, text: string) {
      input.focus();
      fireEvent.change(input, {target: {value: text}});
      fireEvent.keyDown(input, {key: 'Enter', keyCode: 13});
      vi.advanceTimersByTime(1);
    }

    it('keeps a one-line field focused with submitBehavior="submit", inline or the row', () => {
      const onSubmit = vi.fn();
      render(
        <>
          <TextField variant="inline" submitBehavior="submit" onSubmit={onSubmit} testID="inline"/>
          <TextField submitBehavior="submit" onSubmit={onSubmit} testID="row"/>
        </>,
      );
      for (const id of ['inline', 'row']) {
        const input = screen.getByTestId(id);
        enter(input, id);
        expect(onSubmit).toHaveBeenLastCalledWith(id);
        expect(document.activeElement).toBe(input);
      }
    });

    it('gives the focus up with blurAndSubmit, and by default', () => {
      const onSubmit = vi.fn();
      render(
        <>
          <TextField variant="inline" submitBehavior="blurAndSubmit" onSubmit={onSubmit} testID="blurs"/>
          <TextField variant="inline" onSubmit={onSubmit} testID="default"/>
          <TextField submitBehavior="blurAndSubmit" onSubmit={onSubmit} testID="row"/>
        </>,
      );
      for (const id of ['blurs', 'default', 'row']) {
        const input = screen.getByTestId(id);
        enter(input, id);
        expect(onSubmit).toHaveBeenLastCalledWith(id);
        expect(document.activeElement).not.toBe(input);
      }
    });

    it('submits a multi-line field with blurAndSubmit on Enter, and gives the focus up', () => {
      const onSubmit = vi.fn();
      render(<TextField variant="inline" multiline submitBehavior="blurAndSubmit" onSubmit={onSubmit} testID="area"/>);
      const area = screen.getByTestId('area');
      enter(area, 'notes');
      expect(onSubmit).toHaveBeenCalledWith('notes');
      expect(document.activeElement).not.toBe(area);
    });
  });

  it('dims and locks the inline variant when disabled', () => {
    render(<TextField variant="inline" value="Locked" disabled testID="field"/>);
    const input = screen.getByTestId('field');
    expect(input).toHaveAttribute('readonly');
    expect(getComputedStyle(input).opacity).toBe('0.4');
  });

  it('forwards capitalization, autocorrect and length limits', () => {
    render(<TextField autoCapitalize="none" autoCorrect={false} maxLength={6} testID="code"/>);
    const input = screen.getByTestId('code');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('maxlength', '6');
  });
});
