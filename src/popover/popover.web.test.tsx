import {act, fireEvent, render, screen} from '@testing-library/react';
import {Popover} from '.';

describe('Popover (web)', () => {
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

  it('is not seen until it has been measured', () => {
    // jsdom has no ResizeObserver, so react-native-web never lays the card
    // out here; the native and Windows projects measure it.
    render(<Popover at={{x: 10, y: 10}} title="Spelling" testID="pop"/>);
    expect(getComputedStyle(screen.getByTestId('pop')).opacity).toBe('0');
  });

  it('works without anything to call', () => {
    render(<Popover at={{x: 0, y: 0}} title="Spelling" modal testID="pop"/>);
    fireEvent.keyDown(document.body, {key: 'Escape'});
    fireEvent.click(screen.getByTestId('pop-backdrop'));
    expect(screen.getByTestId('pop')).toBeInTheDocument();
  });
});
