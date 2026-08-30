import {Platform} from 'react-native';
import {fillWidth} from '.';

describe(`fillWidth (${Platform.OS})`, () => {
  it('spans the parent width with the platform modifier', () => {
    switch (Platform.OS) {
      case 'ios': {
        // SwiftUI: `.frame(maxWidth:)` with a large finite value, since
        // `Infinity` does not survive JSON serialization to the native side.
        expect(fillWidth).toHaveLength(1);
        const [frame] = fillWidth as Record<string, unknown>[];
        expect(frame.$type).toBe('frame');
        expect(frame.maxWidth).toBeGreaterThanOrEqual(10000);
        expect(Number.isFinite(frame.maxWidth)).toBe(true);
        break;
      }
      case 'android':
        // Compose: `Modifier.fillMaxWidth()`.
        expect(fillWidth).toEqual([{$type: 'fillMaxWidth'}]);
        break;
      default:
        // Web layout primitives already stretch on the cross axis.
        expect(fillWidth).toEqual([]);
    }
  });
});
