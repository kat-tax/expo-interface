import {afterEach} from 'vitest';
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
    const onDismiss = vi.fn();
    render(
      <Sheet isPresented onDismiss={onDismiss}>
        <span>Content</span>
      </Sheet>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('material (web)', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--ui-sheet-blur');
  });

  it('blurs what is behind it, and thins its own fill so the blur shows', async () => {
    render(<Sheet isPresented onDismiss={() => {}} material="regular"><span>Body</span></Sheet>);
    // `backdrop-filter` reaches vaul's portal through a custom property on the
    // root, because @expo/ui's sheet forwards only the props it names.
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('20px');
  });

  it('asks for a thicker blur for a thicker material', async () => {
    render(<Sheet isPresented onDismiss={() => {}} material="thick"><span>Body</span></Sheet>);
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('40px');
  });

  it('sets nothing at all for the opaque sheet, which is the default', async () => {
    render(<Sheet isPresented onDismiss={() => {}}><span>Body</span></Sheet>);
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('');
    render(<Sheet isPresented onDismiss={() => {}} material="none"><span>Body</span></Sheet>);
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('');
  });

  it('gives the property back when the sheet goes', async () => {
    const {unmount} = render(<Sheet isPresented onDismiss={() => {}} material="thin"><span>Body</span></Sheet>);
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('8px');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--ui-sheet-blur')).toBe('');
  });
});
