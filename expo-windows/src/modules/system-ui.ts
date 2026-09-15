/**
 * `ExpoSystemUI`, what `expo-system-ui` sets the root background through.
 * Windows keeps the color; painting the window behind the React Native tree
 * with it is the C++ module's job in a later release — until then the kit's
 * `Screen` paints its own scheme background, which is what shows.
 */
let backgroundColor: string | null = null;

export const ExpoSystemUI = {
  async getBackgroundColorAsync(): Promise<string | null> {
    return backgroundColor;
  },
  async setBackgroundColorAsync(color: string | null): Promise<void> {
    backgroundColor = color;
  },
};
