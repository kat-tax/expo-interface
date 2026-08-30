import {fireEvent, render, screen} from '@testing-library/react';
import {Sheet} from '.';

describe('Sheet (web)', () => {
  it('renders nothing while dismissed', () => {
    render(
      <Sheet isPresented={false} onDismiss={() => {}} testID="sheet">
        <span>Content</span>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByTestId('sheet')).toBeNull();
  });

  it('presents a bottom drawer dialog with the children', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} testID="sheet">
        <span>Content</span>
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    expect(dialog).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('sheet')).toHaveTextContent('Content');
    expect(dialog.querySelector('[data-vaul-handle]')).not.toBeNull();
  });

  it('hides the drag handle on request', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} showDragIndicator={false}>
        <span>Content</span>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').querySelector('[data-vaul-handle]')).toBeNull();
  });

  it('fills the viewport when snap points are configured', () => {
    const {rerender} = render(
      <Sheet isPresented onDismiss={() => {}}>
        <span>Content</span>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').style.maxHeight).toBe('85vh');

    rerender(
      <Sheet isPresented onDismiss={() => {}} snapPoints={['half', 'full']}>
        <span>Content</span>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').style.height).toBe('96vh');
  });

  it('calls onDismiss when the dialog is dismissed', () => {
    const onDismiss = jest.fn();
    render(
      <Sheet isPresented onDismiss={onDismiss}>
        <span>Content</span>
      </Sheet>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
