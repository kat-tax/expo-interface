import {useContext} from 'react';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {SheetBodyCapContext} from './cap-context';
import {Sheet} from '.';

/** Prints the cap a native list in the body would take as its height; the web list, its own scroller, reads none. */
function Cap() {
  const cap = useContext(SheetBodyCapContext);
  return <span>{`cap ${cap}`}</span>;
}

describe('Sheet chrome (web)', () => {
  it('draws the bar the kit draws: the title over the subtitle, back and close at the ends, the menu before close', () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" subtitle="12 unresolved" onBack={onBack} onClose={onClose} menu={[{label: 'Resolve all'}]} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const bar = screen.getByTestId('sheet-bar');
    expect(bar).toHaveTextContent('Comments');
    expect(bar).toHaveTextContent('12 unresolved');
    // The title is the dialog's, at the level of the drawer's own hidden title.
    expect(within(bar).getByRole('heading', {name: 'Comments', level: 2})).toBeInTheDocument();
    fireEvent.click(within(bar).getByRole('button', {name: 'Back'}));
    fireEvent.click(within(bar).getByRole('button', {name: 'Close'}));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(within(bar).getByRole('button', {name: 'More'})).toBeInTheDocument();
    expect(screen.getByRole('menuitem', {name: 'Resolve all', hidden: true})).toBeInTheDocument();
    // The ends are the same width whichever holds a button, so the title stays centred.
    const [leading, , trailing] = bar.children;
    expect(getComputedStyle(leading).minWidth).toBe(getComputedStyle(trailing).minWidth);
  });

  it('draws a bar with a title alone, and the actions, without a test identifier', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Plain" menu={[]} actions={[{label: 'OK'}]}>
        <span>Body</span>
      </Sheet>,
    );
    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'OK'})).toHaveClass('ui-button--filled');
    expect(screen.queryByRole('button', {name: 'More'})).toBeNull();
  });

  it('draws the bar for a close button alone, with no title in it', () => {
    const onClose = vi.fn();
    render(
      <Sheet isPresented onDismiss={() => {}} onClose={onClose} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const bar = screen.getByTestId('sheet-bar');
    fireEvent.click(within(bar).getByRole('button', {name: 'Close'}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(bar.textContent).toBe('close');
  });

  it('draws no bar when nothing asks for one', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} menu={[]} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(screen.queryByTestId('sheet-bar')).toBeNull();
    expect(screen.queryByTestId('sheet-actions')).toBeNull();
    expect(screen.queryByTestId('sheet-body')).toBeNull();
  });

  it('lays the actions out along the bottom edge, the last one filled and the rest outlined', () => {
    const onSave = vi.fn();
    render(
      <Sheet isPresented onDismiss={() => {}} actions={[{label: 'Cancel'}, {label: 'Save', onPress: onSave}]} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const actions = screen.getByTestId('sheet-actions');
    expect(within(actions).getByRole('button', {name: 'Cancel'})).toHaveClass('ui-button--outlined');
    const save = within(actions).getByRole('button', {name: 'Save'});
    expect(save).toHaveClass('ui-button--filled');
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(getComputedStyle(actions).justifyContent).toBe('flex-end');
  });

  it('caps the body, which then scrolls inside a box the sheet\'s width, between the accessory and the footer, from the keyboard too', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" accessory={<span>Filter</span>} footer={<span>Write</span>} maxHeight={300} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    const body = screen.getByTestId('sheet-body');
    expect(body.style.maxHeight).toBe('300px');
    expect(body.style.width).toBe('100%');
    expect(body).toHaveAttribute('tabindex', '0');
    expect(body).toHaveTextContent('Body');
    const text = screen.getByTestId('sheet').textContent!;
    expect(text.indexOf('Comments')).toBeLessThan(text.indexOf('Filter'));
    expect(text.indexOf('Filter')).toBeLessThan(text.indexOf('Body'));
    expect(text.indexOf('Body')).toBeLessThan(text.indexOf('Write'));
  });

  it('caps the body at a fraction of the viewport\'s dynamic height, which follows the browser\'s toolbar', () => {
    render(
      <Sheet isPresented onDismiss={() => {}} maxHeight={{fraction: 0.57}} testID="sheet">
        <span>Body</span>
      </Sheet>,
    );
    expect(screen.getByTestId('sheet-body').style.maxHeight).toBe('57dvh');
  });

  it('tells the body a cap given in points, and nothing for a fraction, which is a viewport length', () => {
    render(<Sheet isPresented onDismiss={() => {}} maxHeight={300}><Cap/></Sheet>);
    expect(screen.getByText('cap 300')).toBeInTheDocument();
    render(<Sheet isPresented onDismiss={() => {}} maxHeight={{fraction: 0.5}}><Cap/></Sheet>);
    expect(screen.getByText('cap undefined')).toBeInTheDocument();
  });
});
