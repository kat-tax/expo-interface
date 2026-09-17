import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Animated, DeviceEventEmitter, Text, View} from 'react-native';
import {colors} from '../theme';
import {loadKeyboardController} from './library';
import {KeyboardBar} from '.';

const library = loadKeyboardController();

type Measurable = {measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void};

/** The view prototype the sticky view measures through, found through a view of our own so a test can spy on it. */
async function viewPrototype(): Promise<Measurable> {
  let probe: Measurable | null = null;
  await render(<View ref={(ref: unknown) => { probe = ref as Measurable; }}/>);
  return Object.getPrototypeOf(probe!) as Measurable;
}

/** The touch keyboard's showing or hiding, as `expo-windows` raises it. */
const show = (height: number) => act(() => {
  DeviceEventEmitter.emit('keyboardDidShow', {endCoordinates: {screenX: 0, screenY: 500, width: 1000, height}});
});
const hide = () => act(() => {
  DeviceEventEmitter.emit('keyboardDidHide', {endCoordinates: {screenX: 0, screenY: 0, width: 0, height: 0}});
});

/** The last translation the bar was animated to. */
function lastTarget(timing: ReturnType<typeof vi.spyOn>) {
  const call = timing.mock.calls.at(-1) as unknown as [unknown, {toValue: number}];
  return call[1].toValue;
}

describe('KeyboardBar (windows)', () => {
  it('loads the kit\'s own keyboard library, whose provider is nothing', async () => {
    expect(library).not.toBeNull();
    const Provider = library!.KeyboardProvider;
    await render(<Provider><Text>Inside</Text></Provider>);
    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('rides up on the touch keyboard by its height and reports it, and comes back down', async () => {
    const timing = vi.spyOn(Animated, 'timing');
    const onKeyboard = vi.fn();
    await render(
      <KeyboardBar onKeyboard={onKeyboard} style={{padding: 4}}>
        <Text>Tools</Text>
      </KeyboardBar>,
    );
    expect(screen.getByText('Tools').parent).toHaveStyle({backgroundColor: colors.light.background, padding: 4});
    expect(onKeyboard).toHaveBeenLastCalledWith(0);
    expect(lastTarget(timing)).toBe(0);
    await show(300);
    expect(onKeyboard).toHaveBeenLastCalledWith(300);
    expect(lastTarget(timing)).toBe(-300);
    await hide();
    expect(onKeyboard).toHaveBeenLastCalledWith(0);
    expect(lastTarget(timing)).toBe(0);
  });

  it('stops following the keyboard with its last reader', async () => {
    const onKeyboard = vi.fn();
    const {unmount} = await render(<KeyboardBar onKeyboard={onKeyboard}><Text>Tools</Text></KeyboardBar>);
    await unmount();
    onKeyboard.mockClear();
    await show(200);
    expect(onKeyboard).not.toHaveBeenCalled();
    await hide();
  });

  it('meets the keyboard\'s reported top from its own measured bottom edge, whatever the window\'s height became', async () => {
    const timing = vi.spyOn(Animated, 'timing');
    // The bar's bottom edge sits 760 points down the window at rest: a measurement the view makes when it is laid out.
    const measure = vi.spyOn(await viewPrototype(), 'measureInWindow').mockImplementation(callback => callback(0, 700, 400, 60));
    const Sticky = library!.KeyboardStickyView;
    await render(<Sticky offset={{opened: 999}}><Text>Measured</Text></Sticky>);
    await fireEvent(screen.getByTestId('keyboard-sticky'), 'layout');
    expect(measure).toHaveBeenCalledTimes(1);
    // The keyboard's top is at 500: the bar rides up by 260, not by what the caller measured under it.
    await show(300);
    expect(lastTarget(timing)).toBe(-260);
    // Laid out again while up — a resize — the view measures where it is, 260 up; the measurement takes the translation out.
    measure.mockImplementation(callback => callback(0, 440, 400, 60));
    await fireEvent(screen.getByTestId('keyboard-sticky'), 'layout');
    await act(() => {
      DeviceEventEmitter.emit('keyboardDidShow', {endCoordinates: {screenX: 0, screenY: 440, width: 1000, height: 300}});
    });
    expect(lastTarget(timing)).toBe(-320);
    await hide();
    expect(lastTarget(timing)).toBe(0);
  });

  it('rests at the closed offset and rides up less what lies under it', async () => {
    const timing = vi.spyOn(Animated, 'timing');
    const Sticky = library!.KeyboardStickyView;
    await render(<Sticky offset={{closed: 5, opened: 40}}><Text>Sticky</Text></Sticky>);
    expect(lastTarget(timing)).toBe(5);
    await show(300);
    expect(lastTarget(timing)).toBe(-260);
    await hide();
    expect(lastTarget(timing)).toBe(5);
    // Nothing under it: the whole height.
    await render(<Sticky offset={{closed: 5}}><Text>Flush</Text></Sticky>);
    await show(300);
    expect(lastTarget(timing)).toBe(-300);
    await hide();
  });
});
