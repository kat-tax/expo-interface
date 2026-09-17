import {ExpoWindows} from './window';

/**
 * `ExpoSystemUI`, what `expo-system-ui` sets the root background through.
 * With the runtime's Windows library in the app the color paints the
 * window itself — behind everything, and what shows while it resizes; the
 * kit's `Screen` paints its own scheme background over it either way.
 */
let backgroundColor: string | null = null;

export const ExpoSystemUI = {
  async getBackgroundColorAsync(): Promise<string | null> {
    return backgroundColor;
  },
  async setBackgroundColorAsync(color: string | null): Promise<void> {
    backgroundColor = color;
    ExpoWindows.setWindowBackground(color);
  },
};
