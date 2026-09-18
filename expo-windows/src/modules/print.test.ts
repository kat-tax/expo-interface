import {TurboModuleRegistry} from 'react-native';
import {ExpoPrint} from './print';

describe('ExpoPrint (windows)', () => {
  it('hands the page to the print dialog, or writes it as a PDF, with the options the library reads', async () => {
    const library = {print: vi.fn(async () => null), printToFile: vi.fn(async () => ({uri: 'file:///C:/cache/Print/a.pdf', numberOfPages: 2}))};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsPrint' ? library : null) as never);
    await expect(ExpoPrint.print({html: '<b>hi</b>', width: 612, height: 792, orientation: 'landscape', printerUrl: 'ipp://x', useMarkupFormatter: true})).resolves.toBeUndefined();
    expect(library.print).toHaveBeenCalledWith({html: '<b>hi</b>', uri: undefined, width: 612, height: 792, orientation: 'landscape', base64: undefined});
    await expect(ExpoPrint.printToFileAsync({uri: 'file:///C:/page.html', base64: true, margins: {top: 1}})).resolves.toEqual({uri: 'file:///C:/cache/Print/a.pdf', numberOfPages: 2});
    expect(library.printToFile).toHaveBeenCalledWith({html: undefined, uri: 'file:///C:/page.html', width: undefined, height: undefined, orientation: undefined, base64: true});
    await ExpoPrint.printToFileAsync();
    expect(library.printToFile).toHaveBeenLastCalledWith({html: undefined, uri: undefined, width: undefined, height: undefined, orientation: undefined, base64: undefined});
    expect(ExpoPrint.Orientation).toEqual({portrait: 'portrait', landscape: 'landscape'});
    expect(ExpoPrint).not.toHaveProperty('selectPrinter');
  });

  it('throws the package\'s error without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoPrint.print({html: 'x'})).rejects.toThrow(/Print\.printAsync/);
    await expect(ExpoPrint.printToFileAsync({html: 'x'})).rejects.toThrow(/Print\.printToFileAsync/);
  });
});
