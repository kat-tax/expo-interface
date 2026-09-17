describe('window chrome (not windows)', () => {
  it('extends nothing, insets nothing and sets no drag region on the other platforms', async () => {
    // The platform resolution would take `./chrome` to the Windows file; the extension pins the plain one.
    const plain = './chrome' + '.ts';
    const chrome = await import(/* @vite-ignore */ plain);
    expect(chrome.useWindowChrome({extend: true})).toBeUndefined();
    expect(chrome.useWindowChromeState()).toEqual({extended: false, insets: {left: 0, right: 0, height: 0}});
    expect(chrome.setDragRegion({x: 0, y: 0, width: 1, height: 1})).toBeUndefined();
    expect(chrome.reportDragRegion(null, {left: 0, right: 0})).toBeUndefined();
  });
});
