import {fireEvent, render, screen} from '@testing-library/react';
import {Text, View} from 'react-native';
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
    // The page's guard leaves a drag the zone took as the zone set it.
    expect(over.dataTransfer.dropEffect).toBe('copy');
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

  it('refuses files dropped beside the zones while any is mounted, so the browser does not open them in place of the app', () => {
    const onDrop = vi.fn();
    const zones = (first: boolean, second: boolean) => (
      <View>
        {first ? <DropZone onDrop={onDrop} testID="a"><Text>A</Text></DropZone> : null}
        {second ? <DropZone onDrop={onDrop} disabled testID="b"><Text>B</Text></DropZone> : null}
      </View>
    );
    const {rerender} = render(zones(true, true));
    const stray = {dataTransfer: {types: ['Files'], files: [], dropEffect: 'copy'}};
    expect(fireEvent.dragOver(document.body, stray)).toBe(false);
    expect(stray.dataTransfer.dropEffect).toBe('none');
    const note = new File(['hello'], 'note.txt', {type: 'text/plain'});
    expect(fireEvent.drop(document.body, files(note))).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
    // A disabled zone takes nothing, and keeps the page from opening it too.
    expect(fireEvent.dragOver(screen.getByTestId('b'), files())).toBe(false);
    // Text and links are the page's.
    expect(fireEvent.dragOver(document.body, text)).toBe(true);
    // A file input takes its own drops, inside a web component too; any other field does not.
    const picker = document.createElement('input');
    picker.type = 'file';
    const field = document.createElement('input');
    field.type = 'text';
    const component = document.createElement('div');
    const inner = document.createElement('input');
    inner.type = 'file';
    component.attachShadow({mode: 'open'}).append(inner);
    document.body.append(picker, field, component);
    expect(fireEvent.dragOver(picker, files())).toBe(true);
    expect(fireEvent.dragOver(field, files())).toBe(false);
    expect(fireEvent.dragOver(inner, files())).toBe(true);
    picker.remove();
    field.remove();
    component.remove();
    // The guard lasts while any zone is mounted, and goes with the last.
    rerender(zones(false, true));
    expect(fireEvent.dragOver(document.body, files())).toBe(false);
    rerender(zones(false, false));
    // A drag that comes in afterwards does not bring it back.
    fireEvent.dragEnter(document.body, files());
    expect(fireEvent.dragOver(document.body, files())).toBe(true);
  });

  it('lets a page-wide target of the app\'s take a file drag before refusing it, wherever and whenever it listens', () => {
    render(<DropZone onDrop={vi.fn()} testID="zone"><Text>Documents</Text></DropZone>);
    // Added after the zone mounted, as a root's effect runs after its children's.
    const heard: boolean[] = [];
    const take = (event: DragEvent) => {
      heard.push(event.defaultPrevented);
      event.preventDefault();
    };
    window.addEventListener('dragover', take);
    window.addEventListener('drop', take);
    fireEvent.dragEnter(document.body, files());
    const taken = {dataTransfer: {types: ['Files'], files: [], dropEffect: 'copy'}};
    expect(fireEvent.dragOver(document.body, taken)).toBe(false);
    // The app's target takes the drag with the effect it chose, and so hears the drop.
    expect(taken.dataTransfer.dropEffect).toBe('copy');
    expect(fireEvent.drop(document.body, files())).toBe(false);
    expect(heard).toEqual([false, false]);
    window.removeEventListener('dragover', take);
    window.removeEventListener('drop', take);
    // What the app's target leaves, the page refuses.
    expect(fireEvent.dragOver(document.body, files())).toBe(false);
  });
});
