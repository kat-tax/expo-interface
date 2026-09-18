import type {PrintJob} from '../native';
import {native} from '../native';
import {UnavailabilityError} from './base';

export type FilePrintResult = {uri: string; numberOfPages: number; base64?: string};

/** The options the package's calls take: what the library reads, and iOS's, taken without effect. */
export type PrintOptions = PrintJob & {markupFormatterIOS?: unknown; useMarkupFormatter?: boolean; printerUrl?: string; margins?: unknown};

/** The options in the shape the library reads. */
function jobOf(options: PrintOptions): PrintJob {
  const {html, uri, width, height, orientation, base64} = options;
  return {html, uri, width, height, orientation, base64};
}

/**
 * `ExpoPrint`, what `expo-print` asks, over the runtime's print
 * library — WebView2 behind the app's window: `print` hands the page, as
 * HTML or by URI, to the system's print dialog; `printToFileAsync` writes
 * it as a PDF into the cache, sized in points and oriented as asked, with
 * the page count and the bytes in base64 when asked. Margins, the markup
 * formatter and a printer chosen ahead are iOS's, taken without effect;
 * `selectPrinter` is absent, as the package reads availability.
 */
export const ExpoPrint = {
  Orientation: {portrait: 'portrait', landscape: 'landscape'},
  async print(options: PrintOptions = {}): Promise<void> {
    const library = native.print();
    if (!library) throw new UnavailabilityError('Print', 'printAsync');
    await library.print(jobOf(options));
  },
  async printToFileAsync(options: PrintOptions = {}): Promise<FilePrintResult> {
    const library = native.print();
    if (!library) throw new UnavailabilityError('Print', 'printToFileAsync');
    return library.printToFile(jobOf(options));
  },
};
