import {fireEvent, render, screen} from '@testing-library/react';
import {Text} from 'react-native';
import {DropZone} from '.';

/** A drag of files, as the browser describes one. */
const files = (...list: File[]) => ({dataTransfer: {types: ['Files'], files: list, dropEffect: 'none'}});
const text = {dataTransfer: {types: ['text/plain'], files: [], dropEffect: 'none'}};

describe('DropZone (web)', () => {
  it('shows the drop while files are held over it, through its children, and hands the files over', () => {
    const onDrop = vi.fn();
    render(
      <DropZone onDrop={onDrop} label="Drop to add" testID="zone">
        <Text testID="child">Documents</Text>
      </DropZone>,
    );
    const zone = screen.getByTestId('zone');
    expect(screen.queryByTestId('zone-over')).toBeNull();
    fireEvent.dragEnter(zone, files());
    expect(screen.getByTestId('zone-over')).toHaveTextContent('Drop to add');
    // Crossing into a child is a leave and an enter of their own: the hold stays.
    fireEvent.dragEnter(screen.getByTestId('child'), files());
    fireEvent.dragLeave(zone, files());
    expect(screen.getByTestId('zone-over')).toBeInTheDocument();
    // The browser drops only where the drag over was taken.
    const over = files();
    expect(fireEvent.dragOver(zone, over)).toBe(false);
    const note = new File(['hello'], 'note.txt', {type: 'text/plain'});
    expect(fireEvent.drop(zone, files(note))).toBe(false);
    expect(onDrop).toHaveBeenCalledWith([{name: 'note.txt', type: 'text/plain', size: 5, file: note}]);
    expect(screen.queryByTestId('zone-over')).toBeNull();
  });

  it('lets go when the drag leaves, and leaves drags of anything but files to the page', () => {
    const onDrop = vi.fn();
    render(<DropZone onDrop={onDrop} testID="zone"><Text>Documents</Text></DropZone>);
    const zone = screen.getByTestId('zone');
    fireEvent.dragEnter(zone, files());
    fireEvent.dragLeave(zone, files());
    expect(screen.queryByTestId('zone-over')).toBeNull();
    fireEvent.dragLeave(zone, files());
    expect(screen.queryByTestId('zone-over')).toBeNull();
    fireEvent.dragEnter(zone, text);
    expect(screen.queryByTestId('zone-over')).toBeNull();
    // A drag dispatched without a transfer carries no files either.
    fireEvent.dragEnter(zone);
    expect(screen.queryByTestId('zone-over')).toBeNull();
    expect(fireEvent.dragOver(zone, text)).toBe(true);
    fireEvent.dragLeave(zone, text);
    expect(fireEvent.drop(zone, text)).toBe(true);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('takes nothing while disabled, and says the default label', () => {
    const onDrop = vi.fn();
    const {rerender} = render(<DropZone onDrop={onDrop} disabled testID="zone"><Text>Documents</Text></DropZone>);
    fireEvent.dragEnter(screen.getByTestId('zone'), files());
    expect(screen.queryByTestId('zone-over')).toBeNull();
    rerender(<DropZone onDrop={onDrop}><Text testID="child">Documents</Text></DropZone>);
    fireEvent.dragEnter(screen.getByTestId('child'), files());
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });
});
