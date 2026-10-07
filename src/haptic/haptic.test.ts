import type {HapticsLibrary} from './play';
import {Platform} from 'react-native';
import {loadHaptics, playHaptic} from './play';
import {haptic} from '.';

/** A stand-in for `expo-haptics`, its calls recorded; `refuse` lists the Android constants the device lacks. */
function fake(refuse: string[] = []) {
  const library = {
    AndroidHaptics: {Drag_Start: 'drag-start', Long_Press: 'long-press', Segment_Tick: 'segment-tick', Clock_Tick: 'clock-tick', Gesture_End: 'gesture-end', Context_Click: 'context-click'},
    ImpactFeedbackStyle: {Light: 'light', Medium: 'medium'},
    impactAsync: vi.fn(() => Promise.resolve()),
    selectionAsync: vi.fn(() => Promise.resolve()),
    performAndroidHapticsAsync: vi.fn((type: string) => (refuse.includes(type) ? Promise.reject(new Error('not supported')) : Promise.resolve())),
  };
  return library as typeof library & HapticsLibrary;
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe(`haptic (${Platform.OS})`, () => {
  it('plays nothing, and never throws, whatever the platform has', () => {
    expect(() => haptic('lift')).not.toThrow();
    expect(() => haptic('step')).not.toThrow();
    expect(() => haptic('drop')).not.toThrow();
  });

  if (Platform.OS === 'windows') return;

  it('loads expo-haptics when it can, and nothing when it cannot', () => {
    expect(() => loadHaptics()).not.toThrow();
    expect(loadHaptics(() => {
      throw new Error('missing');
    })).toBeNull();
    expect(() => playHaptic('lift', null)).not.toThrow();
  });

  if (Platform.OS === 'android') {
    it('plays the constant Android added for each kind', async () => {
      const library = fake();
      playHaptic('lift', library);
      playHaptic('step', library);
      playHaptic('drop', library);
      await settle();
      expect(library.performAndroidHapticsAsync.mock.calls.map(([type]) => type)).toEqual(['drag-start', 'segment-tick', 'gesture-end']);
    });

    it('plays the older constant on a device without the newer one, and nothing when neither plays', async () => {
      const library = fake(['drag-start', 'segment-tick', 'gesture-end', 'context-click']);
      playHaptic('lift', library);
      playHaptic('step', library);
      playHaptic('drop', library);
      await settle();
      expect(library.performAndroidHapticsAsync.mock.calls.map(([type]) => type)).toEqual(['drag-start', 'segment-tick', 'gesture-end', 'long-press', 'clock-tick', 'context-click']);
    });
    return;
  }

  it('plays a medium impact to lift, the selection tick to step, and a light impact to drop', async () => {
    const library = fake();
    playHaptic('lift', library);
    playHaptic('step', library);
    playHaptic('drop', library);
    await settle();
    expect(library.impactAsync.mock.calls).toEqual([['medium'], ['light']]);
    expect(library.selectionAsync).toHaveBeenCalledTimes(1);
    expect(library.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('swallows a generator that fails', async () => {
    const library = fake();
    library.impactAsync.mockImplementation(() => Promise.reject(new Error('busy')));
    expect(() => playHaptic('lift', library)).not.toThrow();
    await settle();
  });
});
