import {native} from '../native';

/**
 * `ExpoWindows`, the runtime's own module for what a desktop app sets on
 * its window: the title, which the kit's Windows stack keeps at the
 * focused screen's ("Settings – My App"). Nothing happens without the
 * runtime's Windows library in the app.
 */
export const ExpoWindows = {
  setWindowTitle(title: string): void {
    native.window()?.setTitle(title);
  },
  async getWindowTitleAsync(): Promise<string> {
    return (await native.window()?.getTitle()) ?? '';
  },
};
