import {saveFile} from '.';

describe('saveFile (web)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (window as {showSaveFilePicker?: unknown}).showSaveFilePicker;
  });

  it('downloads the file where the browser has no save picker', async () => {
    vi.useFakeTimers();
    const created: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:notes';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, {createObjectURL, revokeObjectURL}));
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    await expect(saveFile({name: 'notes.md', content: '# Notes', mimeType: 'text/markdown'})).resolves.toBe(true);
    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('notes.md');
    expect(clicked[0].href).toBe('blob:notes');
    expect(clicked[0].isConnected).toBe(false);
    expect(created[0].type).toBe('text/markdown');
    expect(await created[0].text()).toBe('# Notes');
    // The URL is let go once the click has handed it to the download.
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:notes');
    vi.useRealTimers();
  });

  it('writes through the browser\'s save picker where it has one, and saves nothing when it is dismissed', async () => {
    const written: Blob[] = [];
    const close = vi.fn(() => Promise.resolve());
    const picker = vi.fn(() => Promise.resolve({
      createWritable: () => Promise.resolve({write: (data: Blob) => {
        written.push(data);
        return Promise.resolve();
      }, close}),
    }));
    Object.assign(window, {showSaveFilePicker: picker});
    await expect(saveFile({name: 'data.bin', content: new Uint8Array([104, 105])})).resolves.toBe(true);
    expect(picker).toHaveBeenCalledWith({suggestedName: 'data.bin'});
    expect(await written[0].text()).toBe('hi');
    expect(written[0].type).toBe('application/octet-stream');
    expect(close).toHaveBeenCalledTimes(1);
    picker.mockImplementationOnce(() => Promise.reject(new DOMException('dismissed', 'AbortError')));
    await expect(saveFile({name: 'data.bin', content: ''})).resolves.toBe(false);
    expect(written).toHaveLength(1);
  });

  it('downloads the file when the save picker will not open, and takes only a dismissal as a cancel', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:notes');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, {createObjectURL, revokeObjectURL}));
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    // The picker needs the press that asked for it to be recent: an export that awaited its content has outlasted it.
    const picker = vi.fn(() => Promise.reject(new DOMException('Must be handling a user gesture to show a file picker.', 'SecurityError')));
    Object.assign(window, {showSaveFilePicker: picker});
    await expect(saveFile({name: 'notes.md', content: '# Notes'})).resolves.toBe(true);
    expect(picker).toHaveBeenCalledWith({suggestedName: 'notes.md'});
    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('notes.md');
    // Any other failure to open it downloads too.
    picker.mockImplementationOnce(() => Promise.reject(new TypeError('bad')));
    await expect(saveFile({name: 'notes.md', content: '# Notes'})).resolves.toBe(true);
    expect(clicked).toHaveLength(2);
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
