import {useState} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {AccentProvider} from '../accent';
import {ScrollInsetsContext, useScrollInsets} from '../screen/insets';
import {Sheet} from '.';

/** Prints the scroll insets a list or a form at this point pads by. */
function Insets() {
  const {top, bottom, automatic} = useScrollInsets();
  return <span>{`${top} ${bottom} ${automatic}`}</span>;
}

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

  it('gives its content no scroll insets, whatever screen it opens from', () => {
    render(
      <ScrollInsetsContext.Provider value={{top: 96, bottom: 24, left: 0, right: 0, automatic: true}}>
        <Insets/>
        <Sheet isPresented onDismiss={() => {}} accessory={<Insets/>} footer={<Insets/>} maxHeight={300}>
          <Insets/>
        </Sheet>
      </ScrollInsetsContext.Provider>,
    );
    // The drawer is a portal, which keeps context: the reset is the sheet's own.
    expect(screen.getByText('96 24 true')).toBeInTheDocument();
    expect(screen.getAllByText('0 0 false')).toHaveLength(3);
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
  /** The drawer: vaul's dialog, which carries the material's attributes and paints the fill inline. */
  const drawer = () => screen.getByRole('dialog');
  /** The raised fill thinned by the material's opacity, as `material.css` thins a bar's. */
  const thinned = (percent: number) => `color-mix(in srgb, var(--color-background-element) ${percent}%, transparent)`;

  it('draws the drawer as the bar: the raised fill thinned, and the stylesheet\'s blur, hairline and shadow along its top', () => {
    render(<Sheet isPresented onDismiss={() => {}} material="regular"><span>Body</span></Sheet>);
    // @expo/ui's sheet forwards only the props it names, so the attributes
    // `material.css` reads go onto vaul's drawer once the content is in the page.
    expect(drawer()).toHaveAttribute('data-material', 'regular');
    expect(drawer()).toHaveAttribute('data-material-fill', 'element');
    expect(drawer()).toHaveAttribute('data-material-edge', 'top');
    // The drawer paints its fill inline, where the stylesheet cannot reach: the thinned fill is handed in.
    expect(drawer().style.backgroundColor).toBe(thinned(72));
  });

  it('thins the fill less for a thicker material, and more for a thinner one', () => {
    const {rerender} = render(<Sheet isPresented onDismiss={() => {}} material="thick"><span>Body</span></Sheet>);
    expect(drawer()).toHaveAttribute('data-material', 'thick');
    expect(drawer().style.backgroundColor).toBe(thinned(88));
    rerender(<Sheet isPresented onDismiss={() => {}} material="thin"><span>Body</span></Sheet>);
    expect(drawer()).toHaveAttribute('data-material', 'thin');
    expect(drawer().style.backgroundColor).toBe(thinned(50));
  });

  it('draws the opaque sheet, the default, with nothing of the material\'s', () => {
    const {rerender} = render(<Sheet isPresented onDismiss={() => {}}><span>Body</span></Sheet>);
    expect(drawer()).not.toHaveAttribute('data-material');
    expect(drawer()).not.toHaveAttribute('data-material-edge');
    expect(drawer().style.backgroundColor).toBe('white');
    rerender(<Sheet isPresented onDismiss={() => {}} material="none"><span>Body</span></Sheet>);
    expect(drawer()).not.toHaveAttribute('data-material');
    expect(drawer().style.backgroundColor).toBe('white');
  });

  it('takes the attributes off the drawer when the material goes while the sheet is up', () => {
    const {rerender} = render(<Sheet isPresented onDismiss={() => {}} material="regular"><span>Body</span></Sheet>);
    expect(drawer()).toHaveAttribute('data-material', 'regular');
    rerender(<Sheet isPresented onDismiss={() => {}} material="none"><span>Body</span></Sheet>);
    expect(drawer()).not.toHaveAttribute('data-material');
    expect(drawer()).not.toHaveAttribute('data-material-fill');
    expect(drawer()).not.toHaveAttribute('data-material-edge');
    expect(drawer().style.backgroundColor).toBe('white');
  });

  it('takes the app\'s overlay material unless told otherwise', () => {
    const sheet = (material?: 'none') => (
      <AccentProvider overlayMaterial="thin">
        <Sheet isPresented onDismiss={() => {}} material={material}><span>Body</span></Sheet>
      </AccentProvider>
    );
    const {rerender} = render(sheet());
    expect(drawer()).toHaveAttribute('data-material', 'thin');
    expect(drawer().style.backgroundColor).toBe(thinned(50));
    rerender(sheet('none'));
    expect(drawer()).not.toHaveAttribute('data-material');
    expect(drawer().style.backgroundColor).toBe('white');
  });

  it('keeps a container color the app gives, on the material', () => {
    render(<Sheet isPresented onDismiss={() => {}} material="regular" containerColor="#123456"><span>Body</span></Sheet>);
    expect(drawer().style.backgroundColor).toBe('rgb(18, 52, 86)');
    expect(drawer()).toHaveAttribute('data-material', 'regular');
  });
});

describe('focus (web)', () => {
  /** A page with a button that opens the sheet, which `onDismiss` closes and, when asked, takes the button away with it. */
  function Page({removeOpener = false}: {removeOpener?: boolean}) {
    const [open, setOpen] = useState(false);
    const [gone, setGone] = useState(false);
    return (
      <>
        {gone ? null : <button onClick={() => setOpen(true)}>Open</button>}
        <Sheet
          isPresented={open}
          onDismiss={() => {
            setOpen(false);
            if (removeOpener) setGone(true);
          }}
          title="History">
          <span>Content</span>
        </Sheet>
      </>
    );
  }

  /** Radix returns the focus a tick after the dialog has gone; waits that tick out. */
  const tick = () => act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('moves the keyboard focus to the title as the sheet opens, since the drawer leaves it on a control the dialog hides', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="History" onClose={() => {}}>
        <button>Restore</button>
      </Sheet>,
    );
    expect(document.activeElement).toBe(screen.getByRole('heading', {name: 'History'}));
  });

  it('moves it to the first control that can take it when the sheet has no title', () => {
    render(
      <Sheet isPresented onDismiss={() => {}}>
        <button disabled>Skip</button>
        <button>Restore</button>
      </Sheet>,
    );
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Restore'}));
  });

  it('leaves the focus alone when the sheet has neither', () => {
    render(
      <Sheet isPresented onDismiss={() => {}}>
        <span>Content</span>
      </Sheet>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it('does not move the focus again while the sheet stays open', () => {
    const {rerender} = render(
      <Sheet isPresented onDismiss={() => {}} title="History" onClose={() => {}}>
        <span>Content</span>
      </Sheet>,
    );
    const close = screen.getByRole('button', {name: 'Close'});
    close.focus();
    rerender(
      <Sheet isPresented onDismiss={() => {}} title="History" subtitle="12 versions" onClose={() => {}}>
        <span>Content</span>
      </Sheet>,
    );
    expect(document.activeElement).toBe(close);
  });

  it('moves the focus into a sheet that opens from a button, and gives it back to the button once the sheet has gone', async () => {
    render(<Page/>);
    const opener = screen.getByRole('button', {name: 'Open'});
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole('heading', {name: 'History'}));
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('gives the focus to nothing when the button that opened the sheet has gone with it', async () => {
    render(<Page removeOpener/>);
    const opener = screen.getByRole('button', {name: 'Open'});
    opener.focus();
    fireEvent.click(opener);
    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
    await tick();
    expect(opener.isConnected).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });
});
